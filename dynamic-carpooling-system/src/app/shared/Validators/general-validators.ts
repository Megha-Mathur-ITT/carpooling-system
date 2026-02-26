import { AbstractControl, ValidationErrors } from '@angular/forms';

export class GeneralValidators {
    static noWhitespace(
        control: AbstractControl
    ): ValidationErrors | null {

        const inputFieldValue = (control.value || '').toString().trim();

        if (!inputFieldValue) {
            return {
                whitespace: true
            }
        }

        return null;
    }
}
