import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './form-input.html',
  styleUrl: './form-input.scss',
})
export class FormInput {
  @Input() label!: string;
  @Input() type: string = 'text';
  @Input() formGroup!: FormGroup;
  @Input() controlName!: string;
  @Input() placeholder: string = "";
  @Input() errorMessages: { [key: string]: string } = {};
  @Input() min?: number;
  @Input() max?: number;

  ObjectKeys = Object.keys;

  get control(): FormControl {
    return this.formGroup.get(this.controlName) as FormControl;
  }

  firstError(): string | null {
    if (!this.control || !this.control.errors) {
      return null;
    }

    return this.ObjectKeys(this.control.errors!)[0];
  }
}
