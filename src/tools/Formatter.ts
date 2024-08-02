import Lang from "./Lang.ts";

export default class Formatter {
    public static formatString(str: string, assigns: { [key: string]: string }|undefined = undefined) {
        let formatted = str;

        // replace all transations (Lang::file/key) by value
        const matches = formatted.match(/Lang::[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g);
        if (matches) {
            for (const match of matches) {
                const [file, key] = match.split('::')[1].split('/');
                const value = Lang.GetText(Lang.CreateTranslationContext(file, key));
                formatted = formatted.replaceAll('${'+match+'}', value ?? '');
            }
        }

        // replace all ${key} by value
        if (assigns) {
            for (const key in assigns) {
                const value = assigns[key];
                formatted = formatted.replaceAll('${'+key+'}', value);
            }
        }
        return formatted;
    }
}
