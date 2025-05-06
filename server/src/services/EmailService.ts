import nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });
  }

  async sendEmail(options: SendMailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL, // Ensure default from address
        ...options,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error("Could not send email");
    }
  }
}
