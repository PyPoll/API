import fs from 'fs';
import Formatter from './Formatter.ts';

interface JSONMail {
    subject: string;
    text: string;
    html: string;
}

export default class Mail {
    /**
     * Creates a mail object from an HTML file with specified variables
     * @param subject The mail subject
     * @param path The source HTML file to read mail template from
     * @param assigns The variables to replace in the template
     * @returns The mail object corresponding to the JSON file
     */
    public static fromFile(subject: string, path: string, assigns: { [key: string]: string } = {}): Mail {
        const data = fs.readFileSync(path);
        const html = Formatter.formatString(data.toString(), assigns);

        return Mail.fromJSON({
            subject: Formatter.formatString(subject, assigns),
            text: html,
            html: html
        });
    }

    /**
     * Creates a mail object from a JSON object
     * @param json The json object to use to create the mail
     * @returns The mail object corresponding to the JSON object
     */
    public static fromJSON(json: JSONMail): Mail {
        if (!json.subject || !json.text || !json.html) {
            throw new Error('Invalid mail JSON');
        }

        return new Mail(
            json.subject as string,
            json.text as string,
            json.html as string
        );
    }

    public subject: string;
    public text: string;
    public html: string;

    public constructor(subject: string, text: string, html: string) {
        this.subject = subject;
        this.text = text;
        this.html = html;
    }
}