import smtplib
from email.message import EmailMessage

# 1. Define credentials and connection settings
SMTP_SERVER = "smtp.gmail.com"  # Replace with your provider's SMTP server
SMTP_PORT = 465                 # Port for SSL connection
SENDER_EMAIL = "superzap77@gmail.com"
SENDER_PASSWORD = "xkja acxt fczk voai"  # Use app password, not primary!
RECEIVER_EMAIL = "superzap77@gmail.com"

# 2. Construct and send the email
msg = EmailMessage()
msg.set_content("Hello from Python!")
msg["Subject"] = "Automated Email"
msg["From"] = SENDER_EMAIL
msg["To"] = RECEIVER_EMAIL

with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
    server.login(SENDER_EMAIL, SENDER_PASSWORD)
    server.send_message(msg)
