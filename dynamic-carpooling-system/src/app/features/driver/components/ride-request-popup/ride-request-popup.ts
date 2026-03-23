import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, NgZone ,  ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RideRequestService } from '../../../../core/services/ride-request-service';

@Component({
  selector: 'app-ride-request-popup',
  imports: [CommonModule],
  templateUrl: './ride-request-popup.html',
  styleUrl: './ride-request-popup.scss',
})
export class RideRequestPopup implements OnChanges, OnDestroy {
  @Input() request: any = null;
  @Output() accepted = new EventEmitter<void>();
  @Output() rejected = new EventEmitter<void>();

  isLoading = false;
  timeLeft = 30;
  timerPercent = 100;
  private timer: any = null;

  constructor(
    private rideRequestService: RideRequestService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges() {
    if (this.request) {
      this.startTimer();
    } else {
      this.stopTimer();
    }
  }

  startTimer() {
  this.timeLeft = 30;
  this.timerPercent = 100;
  this.stopTimer();

  this.ngZone.runOutsideAngular(() => {  
    this.timer = setInterval(() => {
      this.ngZone.run(() => {            
        this.timeLeft--;
        this.timerPercent = (this.timeLeft / 30) * 100;
        this.cdr.markForCheck();

        if (this.timeLeft <= 0) {
          this.stopTimer();
          this.autoReject();
        }
      });
    }, 1000);
  });
}

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  autoReject() {
    if (!this.request) return;
    this.isLoading = true;
    this.rideRequestService.respondToRequest(
      this.request.requestId,
      'Rejected'
    ).subscribe({
      next: () => { this.rejected.emit(); this.isLoading = false; },
      error: () => { this.rejected.emit(); this.isLoading = false; }
    });
  }

  accept() {
  this.stopTimer();
  this.isLoading = true;
  
  this.rideRequestService.respondToRequest(
    this.request.requestId,
    'Accepted'
  ).subscribe({
    next: (res) => { 
      this.accepted.emit(); 
      this.isLoading = false; 
    },
    error: (err) => { 
      console.error('Accept error:', err);
      this.isLoading = false; 
    }
  });
}

  reject() {
    this.stopTimer();
    this.isLoading = true;
    this.rideRequestService.respondToRequest(
      this.request.requestId,
      'Rejected'
    ).subscribe({
      next: () => { this.rejected.emit(); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}