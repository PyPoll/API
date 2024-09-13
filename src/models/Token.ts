import Lang from "tools/Lang.ts";
import { buildResourceMessages } from "tools/Model.ts";

export class Token {
    public static MESSAGES = {
        ...buildResourceMessages(Lang.GetText(
            Lang.CreateTranslationContext('models', 'Token')
        ))
    };
}
