import {
  Component,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-ride-pin-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ride-pin-verify.html',
  styleUrl: './ride-pin-verify.scss',
})
export class RidePinVerify implements OnDestroy {
  @Input() rideId: string = '';
  @Input() expectedPin: string = '';

  @Output() pinVerified = new EventEmitter<string>();
  @Output() resendRequested = new EventEmitter<void>();
  
  @ViewChildren('pinBox') pinBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  pinControls = new FormArray(
    Array.from({ length: 6 }, () =>
      new FormControl('', [Validators.required, Validators.pattern(/^\d$/)])
    )
  );

  state: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  statusMessage = '';
  resendCooldown = 0;

  private resendTimer: any;

  get pin(): string {
    return this.pinControls.controls.map(c => c.value ?? '').join('');
  }

  get isComplete(): boolean {
    return this.pin.length === 6;
  }

  ngOnDestroy(): void {
    clearInterval(this.resendTimer);
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (input.value) {
        this.pinControls.at(index).setValue('');
      } else if (index > 0) {
        this.pinControls.at(index - 1).setValue('');
        this.focusBox(index - 1);
      }
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      this.focusBox(index - 1);
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowRight' && index < 5) {
      this.focusBox(index + 1);
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter' && this.isComplete) {
      this.verify();
    }
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');

    if (!raw) {
      this.pinControls.at(index).setValue('');
      return;
    }

    if (raw.length > 1) {
      this.pasteFill(raw);
      return;
    }

    this.pinControls.at(index).setValue(raw[0]);
    this.state = 'idle';
    this.statusMessage = '';

    if (index < 5) {
      this.focusBox(index + 1);
    }
  }

  onPaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    this.pasteFill(text);   
  }

  private pasteFill(text: string): void {
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    digits.forEach((d, i) => this.pinControls.at(i)?.setValue(d));
    const nextIndex = Math.min(digits.length, 5);
    this.focusBox(nextIndex);
    this.state = 'idle';
    this.statusMessage = '';
  }

  private focusBox(index: number): void {
    setTimeout(() => {
      this.pinBoxes.toArray()[index]?.nativeElement.focus();
    }, 0);
  }

  verify(): void {
    if (!this.isComplete || this.state === 'loading') return;
    this.state = 'loading';
    this.statusMessage = 'Verifying…';

    setTimeout(() => {
      if (this.pin === this.expectedPin) {  // ← compare against real PIN
        this.state = 'success';
        this.statusMessage = 'PIN verified — boarding confirmed!';
        this.pinVerified.emit(this.pin);
      } else {
        this.state = 'error';
        this.statusMessage = 'Incorrect PIN. Please try again.';
        setTimeout(() => this.reset(), 900);
      }
    }, 300);
  }

  reset(): void {
    this.pinControls.controls.forEach(c => c.setValue(''));
    this.state = 'idle';
    this.statusMessage = '';
    this.focusBox(0);
  }

  resend(): void {
    if (this.resendCooldown > 0) return;
    this.resendRequested.emit();
    this.statusMessage = 'PIN resent to passenger.';

    this.resendCooldown = 30;
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.resendTimer);
        if (this.statusMessage === 'PIN resent to passenger.') {
          this.statusMessage = '';
        }
      }
    }, 1000);
  }

  boxState(index: number): 'active' | 'filled' | 'error' | '' {
    if (this.state === 'error') return 'error';
    if (this.state === 'success') return 'filled';
    const val = this.pinControls.at(index).value;
    if (val) return 'filled';
    const filled = this.pinControls.controls.filter(c => c.value).length;
    if (index === filled) return 'active';
    return '';
  }
}