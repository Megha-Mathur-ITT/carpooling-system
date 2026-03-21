import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private connection: signalR.HubConnection | null = null;
  private readonly hubUrl = 'http://localhost:5091/hubs/ride';

  connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  rideRequested$ = new BehaviorSubject<any>(null);
  rideAccepted$ = new BehaviorSubject<any>(null);
  rideRejected$ = new BehaviorSubject<any>(null);
  paymentConfirmed$ = new BehaviorSubject<any>(null);
  paymentDenied$ = new BehaviorSubject<any>(null);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  async connect(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.connection !== null && this.connection.state === signalR.HubConnectionState.Connected) {
      console.warn('[SignalR] Already connected.');
      return;
    }

    if (this.connection !== null) {
      await this.connection.stop().catch(() => { });
      this.connection = null;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('[SignalR] No token found. Cannot connect.');
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.registerHandlers();

    try {
      await this.connection.start();
      this.connectionStatus$.next('connected');
      console.log('[SignalR] Connected. ConnectionId:', this.connection.connectionId);
    } catch (err) {
      this.connectionStatus$.next('disconnected');
      console.error('[SignalR] Connection failed:', err);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.connectionStatus$.next('disconnected');
      console.log('[SignalR] Disconnected.');
    }
  }

  private registerHandlers(): void {
    if (!this.connection) return;

    this.connection.on('NewRideRequest', (data) => {
      console.log('[SignalR] NewRideRequest received:', data);
      this.rideRequested$.next(data);
    });

    this.connection.on('RideAccepted', (data) => {
      console.log('[SignalR] RideAccepted received:', data);
      this.rideAccepted$.next(data);
      setTimeout(() => this.rideAccepted$.next(null), 100);
    });

    this.connection.on('RideRejected', (data) => {
      console.log('[SignalR] RideRejected received:', data);
      this.rideRejected$.next(data);
      setTimeout(() => this.rideRejected$.next(null), 100);
    });

    this.connection.on('RideCancelled', (data) => {
      console.log('[SignalR] RideCancelled received:', data);
      this.rideRequested$.next(null);
    });

    this.connection.onreconnecting(() => {
      this.connectionStatus$.next('reconnecting');
      console.warn('[SignalR] Reconnecting...');
    });

    this.connection.onreconnected(() => {
      this.connectionStatus$.next('connected');
      console.log('[SignalR] Reconnected.');
    });

    this.connection.onclose(() => {
      this.connectionStatus$.next('disconnected');
      console.warn('[SignalR] Connection closed.');
    });

    this.connection.on('PaymentConfirmed', (data) => {
      console.log('[SignalR] PaymentConfirmed received:', data);
      this.paymentConfirmed$.next(data);
      setTimeout(() => {
        this.paymentConfirmed$.next(null);
      },
        100);
    });

    this.connection.on('PaymentDenied', (data) => {
      console.log('[SignalR] PaymentDenied received:', data);
      this.paymentDenied$.next(data);
      setTimeout(() => {
        this.paymentDenied$.next(null)
      },
        100);
    });
  }

  notifyDriver(
    driverId: string,
    rideRequestId: string,
    pickup: any,
    destination: any
  ): void {
    console.log('[SignalR] Inside notifyDriver.');
    if (!this.connection) {
      console.warn('[SignalR] Not connected. Cannot notify driver.');
      return;
    }

    this.connection.invoke('NotifyDriver', {
      driverId,
      rideRequestId,
      pickupName: pickup.name,
      pickupLat: pickup.latitude,
      pickupLng: pickup.longitude,
      destinationName: destination.name
    }).catch(error => {
      console.error('[SignalR] NotifyDriver failed:', error);
    });
  }

  resetRideState(): void {
    this.rideAccepted$.next(null);
    this.rideRejected$.next(null);
  }

  notifyCancelRide(rideRequestId: string): void {
    if (!this.connection) {
      console.warn('[SignalR] Not connected. Cannot cancel ride.');
      return;
    }

    this.connection.invoke('CancelRide', { rideRequestId })
      .catch(error => {
        console.error('[SignalR] CancelRide failed:', error);
      });
  }

  notifyPaymentConfirmed(
    passengerId: string,
    rideRequestId: string
  ) {
    if (!this.connection) {
      console.warn('[SignalR] Not connected. Cannot confirm payment.');
      return;
    }

    this.connection.invoke('ConfirmPayment', {
      passengerId,
      rideRequestId
    }).catch(error =>
      console.error('[SignalR] ConfirmPayment failed:', error)
    )
  }

  notifyPaymentDenied(passengerId: string, rideRequestId: string): void {
    if (!this.connection) {
      console.warn('[SignalR] Not connected. Cannot deny payment.');
      return;
    }

    this.connection.invoke('DenyPayment', {
      passengerId,
      rideRequestId
    }).catch(error =>
      console.error('[SignalR] DenyPayment failed:', error)
    );
  }
}