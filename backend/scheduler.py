import asyncio
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from database import supabase
from integrations.scanner import run_scan_pipeline
import uuid

# Initialize the scheduler
scheduler = AsyncIOScheduler()

def calculate_next_run(frequency: str) -> str:
    now = datetime.now(timezone.utc)
    if frequency == 'daily':
        next_run = now + timedelta(days=1)
    elif frequency == 'weekly':
        next_run = now + timedelta(weeks=1)
    elif frequency == 'biweekly':
        next_run = now + timedelta(weeks=2)
    elif frequency == 'monthly':
        next_run = now + timedelta(days=30)
    else:
        next_run = now + timedelta(weeks=1) # Default
    return next_run.isoformat()

async def check_and_run_schedules():
    """
    Background job that runs periodically to check if any scan schedules are due.
    """
    if not supabase:
        print("[Scheduler] Supabase client not configured.")
        return

    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Query schedules where enabled = true AND next_run_at <= now
        # We also want to make sure it's valid, but Supabase doesn't natively support 
        # a simple <= comparison on strings directly sometimes, but let's try.
        response = supabase.table("scan_schedules") \
            .select("*") \
            .eq("enabled", True) \
            .lte("next_run_at", now_iso) \
            .execute()

        schedules = response.data
        if not schedules:
            return

        for schedule in schedules:
            domain = schedule.get("domain")
            schedule_id = schedule.get("id")
            user_id = schedule.get("user_id")
            frequency = schedule.get("frequency")
            
            print(f"[Scheduler] Triggering scheduled scan for {domain} (Schedule ID: {schedule_id})")

            # 1. Create a new scan record in the 'scans' table
            new_scan_id = str(uuid.uuid4())
            try:
                scan_res = supabase.table("scans").insert({
                    "id": new_scan_id,
                    "domain": domain,
                    "user_id": user_id,
                    "status": "crawling"
                }).execute()
                
                # If Supabase auto-generates ID and we shouldn't force UUID, we can just omit 'id'
                # But typically we can pass 'id' if the column allows it. 
                # Let's assume the insert succeeded, we get the real ID back:
                if scan_res.data:
                    new_scan_id = scan_res.data[0].get("id", new_scan_id)
            except Exception as e:
                print(f"[Scheduler] Failed to create scan record: {e}")
                continue
                
            # 2. Update the schedule record immediately so we don't trigger it again in the next minute
            next_run = calculate_next_run(frequency)
            supabase.table("scan_schedules").update({
                "last_run_at": now_iso,
                "last_scan_id": new_scan_id,
                "next_run_at": next_run,
                "updated_at": now_iso
            }).eq("id", schedule_id).execute()

            # 3. Fire the scan pipeline asynchronously
            # We don't await this directly in the loop to avoid blocking other schedules
            asyncio.create_task(run_scan_pipeline(new_scan_id, domain))

    except Exception as e:
        print(f"[Scheduler] Error processing schedules: {e}")

def start_scheduler():
    """Starts the APScheduler background jobs."""
    # Run the check every 1 minute
    scheduler.add_job(check_and_run_schedules, 'interval', minutes=1, id='check_schedules')
    scheduler.start()
    print("[Scheduler] APScheduler started. Background scan polling is active.")

def stop_scheduler():
    """Stops the APScheduler."""
    scheduler.shutdown()
    print("[Scheduler] APScheduler stopped.")
