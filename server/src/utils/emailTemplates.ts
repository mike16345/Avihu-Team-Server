export const welcomeEmailTemplate = (password: string) => ({
  subject: "ברוכים הבאים ל-AvihuTeam!",
  text: `ברוכים הבאים ל-AvihuTeam!\n\nהסיסמה שלך היא: ${password}\n\nבהצלחה!`,
  html: `
    <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
      <h2 style="color: #2c3e50;">ברוכים הבאים ל-AvihuTeam!</h2>
      <p style="font-size: 16px; color: #333;">
        אנו שמחים שהצטרפת אלינו. להלן הסיסמה שלך:
      </p>
      <p style="font-size: 18px; color: #000; font-weight: bold; background-color: #e8f0fe; padding: 10px; border-radius: 5px; display: inline-block;">
        ${password}
      </p>
      <p style="font-size: 16px; color: #333; margin-top: 20px;">
        בהצלחה!
        <br/>
        צוות AvihuTeam
      </p>
    </div>
  `,
});

export const leadEmailTemplate = (name: string, phone: string, email: string) => ({
  subject: "משתמש חדש השאיר לך פרטים",
  text: `${name} השאיר לך פרטים.\n\nמספר טלפון: ${phone}\n\nכתובת מייל: ${email}`,
  html: `
    <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
      <h2 style="color: #2c3e50;">"משתמש חדש השאיר לך פרטים!</h2>
      <p style="font-size: 16px; color: #333;">
        ${name} התרשם מהאפליקציה והשאיר לך את הפרטים שךו בכדי שיחזרו אליו.
      </p>
      <p style="font-size: 18px; color: #000; font-weight: bold; background-color: #e8f0fe; padding: 10px; border-radius: 5px; display: inline-block;">
        ${email}
      </p>
      <p style="font-size: 18px; color: #000; font-weight: bold; background-color: #e8f0fe; padding: 10px; border-radius: 5px; display: inline-block;">
        ${phone}
      </p>
      <p style="font-size: 16px; color: #333; margin-top: 20px;">
        בהצלחה!
      </p>
    </div>
  `,
});
