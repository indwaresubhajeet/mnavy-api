type EmailTemplate = {
  subject: string;
  body: string;
};

/**
 * Testing template
 */
export const testEmailTemplate = (username: string): EmailTemplate => {
  const subject = 'Email Gateway Test';
  const template = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Gateway Test</title>
      </head>
      <body>
          <h1>Email Gateway working succesfully in MNavy</h1><br><br>
          <h4>Name: ${username}</h4>
      </body>
      </html>`;
  return { subject: subject, body: template };
};

/**
 * Email OTP template
 */
export const otpEmailTemplate = (username: string, emailId: string, otp: number): EmailTemplate => {
  const subject = 'MNavy : OTP Verification';
  const template = `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>MNavy_OTP_Template</title>
                </head>
                <body style="padding: 0; margin: 0; font-family: 'Poppins', Sans-serif; background-color: #edd3f8;">
                    <div class="container" style="max-width: 650px; margin: auto; background-color: #fff;">
                        <div class="sec1" style="max-width: 650px; text-align: center; padding:24px;">
                            <h2>MNavy Medical Inventory</h2>
                        </div>
                        <div class="sec2" style="text-align: center; padding:24px; background-color: #0066cc;">
                            <h3 style="color: #fff; font-size: 24px; font-weight: 100; line-height: 4px;"> Verify Your Account On </h3>
                            <h4 style="font-size: 24px; color: #fff; font-weight: 800; line-height: 4px;"> MNavy </h4>
                        </div>
                        <div class="sec3" style="padding:24px;">
                            <div class="sec3-sub1" style="max-width: 480px; text-align: left; padding:24px; margin: auto;">
                                <h3 style="color: #212121; font-size: 20px; font-weight: 100; line-height: 4px;"> Hello
                                    <b>${username}</b>,
                                </h3>
                                <p style="color: #212121; line-height: 24px;">We received a request to access your MNavy <br>
                                    account <b>${emailId}</b> through your email address. Your MNavy verification code is:
                                </p>
                                <div style="text-align: center; padding: 24px 0px;">
                                    <h1 style="background-color: #0066cc; padding: 12px 32px; color: #fff; margin: auto; font-weight: 900; border-radius: 8px; width: max-content; letter-spacing: 8px;">${otp}</h1>
                                </div>
                                <p style="color: #212121; line-height: 24px;">If you did not request this code, it is possible that someone else is trying to access the
                                    MNavy account <b>${emailId}</b> . <span style="color: red; font-weight: 900;">Do not forward or give this code to anyone.</span>
                                </p>
                                <p style="color: #212121; line-height: 24px;">
                                    You received this message because this email address was used to register for verification with
                                    MNavy.
                                </p>
                            </div>
                        </div>
                        <div class="sec4" style="padding:24px; text-align: center; background-color: #0066cc;">
                            <p style="color: #fff; line-height: 20px; margin: auto;">
                                <b>Team MNavy</b><br>
                                Maritime Medical Inventory Management System<br>
                                <a href="mailto:support@mnavy.com" style="color: #fff;">support@mnavy.com</a>
                            </p>
                        </div>
                    </div>
                </body>
                </html>`;
  return { subject: subject, body: template };
};
