import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from app.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    async def send_email(subject: str, recipient: str, body: str, is_html: bool = False):
        """Generic async email sender."""
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning(f"Email NOT SENT to {recipient} - SMTP credentials not configured.")
            logger.info(f"EMAIL CONTENT:\nSubject: {subject}\nBody: {body}")
            return False

        message = MIMEMultipart()
        message["From"] = settings.SMTP_FROM
        message["To"] = recipient
        message["Subject"] = subject

        part = MIMEText(body, "html" if is_html else "plain")
        message.attach(part)

        try:
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=True if settings.SMTP_PORT == 465 else False,
                start_tls=True if settings.SMTP_PORT == 587 else False,
            )
            logger.info(f"Email sent successfully to {recipient}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {e}")
            return False

    @staticmethod
    async def send_expiration_notification(member_email: str, member_name: str, subscription_id: int):
        """Send notification about subscription expiration."""
        subject = "Abonamentul tău la Fitness Center a expirat"
        body = f"""
        Salut {member_name},

        Te informăm că abonamentul tău (ID #{subscription_id}) a expirat.
        Accesul tău la facilitățile noastre a fost restricționat temporar.

        Te rugăm să îți reînnoiești abonamentul din contul tău pentru a continua antrenamentele!

        O zi frumoasă,
        Echipa Fitness Center
        """
        return await EmailService.send_email(subject, member_email, body)
