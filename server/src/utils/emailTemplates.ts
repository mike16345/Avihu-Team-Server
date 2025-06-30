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
