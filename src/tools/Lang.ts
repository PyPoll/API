import { getRootDir } from 'index.ts';
import Formatter from './Formatter.ts';
import fs from 'fs';

interface TranslationFile {
    [key: string]: string;
}
interface TranslationContext {
    file: string;
    code: string;
    format?: { [key: string]: string };
}

type TranslationFileOrNull = TranslationFile|null;

export default class Lang {
    private static translationFilesRootFolder =  getRootDir() + "langs";
    private static fetchedTranslationFiles: {[key: string]: TranslationFile|undefined|null} = {};
    private static language: string = "en";

    static getFallbackLanguageCode() {
        return "en";
    }

    static getTranslationFile(filePath: string): TranslationFileOrNull {
        if (this.fetchedTranslationFiles[filePath] === null)
            return null;
        if (this.fetchedTranslationFiles[filePath] !== undefined) {
            return this.fetchedTranslationFiles[filePath] ?? null;
        }

        try {
            const data = fs.readFileSync(filePath);
            const json = JSON.parse(data.toString());
            this.fetchedTranslationFiles[filePath] = json as TranslationFileOrNull;
            return json as TranslationFile;
        } catch {
            this.fetchedTranslationFiles[filePath] = null;
            return null;
        }
    }

    static getFilePath(language: string, file: string) {
        return `${this.getTranslationFilesRootFolder()}/${language}/${file}.json`
    }

    static sanitizeLanguageCode(code: string) {
        if (!code) return null;
        if (code.length > 2) code = code.split("-")[0];
        if (code.length > 2) code = code.substring(0, 2);
        return code.toLowerCase();
    }

    static getTranslationFilesRootFolder() {
        return this.translationFilesRootFolder;
    }

    static processTranslation(translation: string|Array<string>) {
        if (typeof translation === "string") return translation;
        if (Array.isArray(translation)) return translation.join("\n");
        return JSON.stringify(translation);
    }

    static getLanguages() {
        return [
            { value: "en", name: "English" },
            { value: "fr", name: "Français" },
            { value: "",   name: "Auto"}
        ];
    }

    static getLanguage() {
        return this.language;
    }

    static setLanguage(value: string) {
        this.language = this.sanitizeLanguageCode(value) ?? this.language;
    }

    static Translate(context: TranslationContext) {
        const filePath = this.getFilePath(this.getLanguage(), context.file);
        const translationFile = this.getTranslationFile(filePath);

        if (translationFile && translationFile[context.code] !== undefined)
            return this.processTranslation(translationFile[context.code]);

        const fallbackFilePath = this.getFilePath(this.getFallbackLanguageCode(), context.file);
        const fallbackTranslationFile = this.getTranslationFile(fallbackFilePath);
        if (fallbackTranslationFile && fallbackTranslationFile[context.code])
            return this.processTranslation(fallbackTranslationFile[context.code]);

        console.trace(
            "Translation not found for code [" + context.code + "] in file : [" + context.file + "]\n" +
            "Language : [" + this.language + "]\n" +
            "Fallback language : [" + this.getFallbackLanguageCode() + "]\n" +
            "Translation file : [" + filePath + "]\n" +
            "Fallback translation file : [" + fallbackFilePath + "]\n"
            );
        return '';
    }

    static GetText(context: TranslationContext) {
        if (typeof(context) === 'string') return context;
        if (typeof(context) === 'number') return context;

        const translation = this.Translate(context);
        return Formatter.formatString(translation, context.format);
    }

    static CreateTranslationContext(file: string, code: string, format: { [key: string]: string }|undefined = undefined): TranslationContext {
        return {file, code, format: format ?? undefined};
    }
}