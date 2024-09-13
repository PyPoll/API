import Lang from "tools/Lang.ts";
import { buildResourceMessages } from "tools/Model.ts";

export class Portal {
    public static MESSAGES = {
        ...buildResourceMessages(Lang.GetText(
            Lang.CreateTranslationContext('models', 'Portal')
        ))
    };
}
