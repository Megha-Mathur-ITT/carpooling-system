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

    static required(control: AbstractControl): ValidationErrors | null {
        const inputFieldValue = control.value.trim();

        if (!inputFieldValue) {
            return null;
        }

        return null;
    }
}
