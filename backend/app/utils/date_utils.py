from datetime import date, timedelta


def calculate_working_days(start_date: date, num_days: int) -> date:
    """Add num_days working days to start_date, skipping weekends."""
    current = start_date
    added = 0
    while added < num_days:
        current += timedelta(days=1)
        if current.weekday() < 5:
            added += 1
    return current


def calculate_working_days_between(start: date, end: date) -> int:
    """Count working days between two dates."""
    if not start or not end:
        return 0
    days = 0
    current = start
    while current < end:
        current += timedelta(days=1)
        if current.weekday() < 5:
            days += 1
    return days


def calculate_working_days_since(from_date) -> int:
    """Count working days from a date until today."""
    if not from_date:
        return 0
    if hasattr(from_date, 'date'):
        from_date = from_date.date()
    return calculate_working_days_between(from_date, date.today())
