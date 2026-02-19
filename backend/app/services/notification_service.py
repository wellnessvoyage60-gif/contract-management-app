from app.core.config import settings


def send_email(to: str, subject: str, html_body: str, cc: list = None):
    """Send email via SMTP. Prints to console in dev mode."""
    print(f'[EMAIL] To: {to} | Subject: {subject}')
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = to
        if cc:
            msg['Cc'] = ', '.join(cc)
        msg.attach(MIMEText(html_body, 'html'))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USER:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            recipients = [to] + (cc or [])
            server.sendmail(settings.EMAIL_FROM, recipients, msg.as_string())
        print(f'[EMAIL SENT] {subject}')
    except Exception as e:
        print(f'[EMAIL FAILED] {e}')


def send_assignment_email(contract, reviewer_id, db):
    from app.models.user import User
    reviewer = db.query(User).get(reviewer_id)
    if reviewer:
        link = f'{settings.APP_URL}/contracts/{contract.id}'
        html = f'<p>Hi {reviewer.full_name},</p>'
        html += f'<p>You have been assigned to review: <b>{contract.title}</b></p>'
        html += f'<p>Contract: {contract.contract_number}</p>'
        html += f'<p><a href="{link}">Click here to open the contract</a></p>'
        send_email(reviewer.email, f'Contract Review: {contract.title}', html)


def send_approval_email(contract, db):
    from app.models.user import User
    uploader = db.query(User).get(contract.uploader_id)
    if uploader:
        html = f'<p>Hi {uploader.full_name},</p>'
        html += f'<p>Contract <b>{contract.contract_number}</b> has been approved!</p>'
        send_email(uploader.email, f'Contract Approved: {contract.title}', html)


def send_reminder_email(contract, reminder_number, db):
    from app.models.user import User
    handler = db.query(User).get(contract.current_handler_id)
    uploader = db.query(User).get(contract.uploader_id)
    if handler:
        html = f'<p>Reminder #{reminder_number}: Please review {contract.contract_number}</p>'
        cc = [uploader.email] if uploader else []
        send_email(handler.email, f'Reminder: {contract.title}', html, cc=cc)


def send_escalation_email(contract, manager, handler, db):
    from app.models.user import User
    uploader = db.query(User).get(contract.uploader_id)
    html = f'<p>ESCALATION: {handler.full_name} has not reviewed {contract.contract_number}</p>'
    cc = [uploader.email] if uploader else []
    send_email(manager.email, f'Escalation: {contract.title}', html, cc=cc)


def send_vendor_response_email(contract, db):
    from app.models.user import User
    uploader = db.query(User).get(contract.uploader_id)
    if uploader:
        html = f'<p>Vendor has responded to {contract.contract_number}</p>'
        send_email(uploader.email, f'Vendor Response: {contract.title}', html)
