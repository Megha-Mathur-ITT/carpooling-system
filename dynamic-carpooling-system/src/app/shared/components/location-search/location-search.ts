import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
  NgZone,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';

export interface SelectedLocation {
  latitude: number;
  longitude: number;
  name: string;
  displayName?: string;
}

interface PopularCity {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-location-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-search.html',
  styleUrls: ['./location-search.scss'],
})
export class LocationSearchComponent implements OnInit, OnDestroy, OnChanges {
  private cache = new Map<string, any[]>();

  @Input() placeholder: string = 'Search for a location...';
  @Input() defaultCity: string = 'Jaipur';
  @Input() currentLocation: any;

  @Output() locationSelected = new EventEmitter<SelectedLocation>();

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  private ngZone = inject(NgZone);

  query: string = '';
  results: any[] = [];
  isLoading = false;
  isFocused = false;
  showDropdown = false;
  activeIndex = -1;

  private debounceTimer: any;

  popularCities: PopularCity[] = [
    { name: 'New Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
    { name: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
    { name: 'Bangalore', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
    { name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
    { name: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
    { name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
    { name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
    { name: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  ];

  ngOnInit() {
    if (this.currentLocation) {
      this.query = this.currentLocation.name;
      return;
    }

    const def =
      this.popularCities.find((c) => c.name === this.defaultCity) ||
      this.popularCities[3];

    setTimeout(() => {
      this.locationSelected.emit({
        latitude: def.latitude,
        longitude: def.longitude,
        name: def.name,
      });
    })

    if (this.currentLocation) {
      this.query = this.currentLocation.name;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentLocation'] && changes['currentLocation'].currentValue) {
      this.query = changes['currentLocation'].currentValue.name;
    }
  }

  ngOnDestroy() {
    clearTimeout(this.debounceTimer);
    this.cache.clear();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('app-location-search')) {
      this.showDropdown = false;
    }
  }

  onFocus() {
    this.isFocused = true;
    this.showDropdown = true;
  }

  onBlur() {
    this.isFocused = false;

    setTimeout(() => {
      this.showDropdown = false;
    }, 200);

    if (this.currentLocation) {
      this.query = this.currentLocation.name;
    }
  }

  onInput(event: Event) {
    clearTimeout(this.debounceTimer);

    const value = (event.target as HTMLInputElement).value;
    this.query = value;
    this.activeIndex = -1;
    this.showDropdown = true;

    if (!value || value.length < 3) {
      this.results = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    this.debounceTimer = setTimeout(() => {
      this.fetchSuggestions(value);
    }, 500);
  }

  onKeydown(event: KeyboardEvent) {
    const total = this.results.length;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, total - 1);
    }
    else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
    }
    else if (event.key === 'Enter') {
      if (this.activeIndex >= 0 && this.results[this.activeIndex]) {
        this.selectLocation(this.results[this.activeIndex]);
      }
    }
    else if (event.key === 'Escape') {
      this.showDropdown = false;
      this.inputRef.nativeElement.blur();
    }
  }

  clearQuery(event: MouseEvent) {
    event.preventDefault();

    this.query = '';
    this.results = [];
    this.activeIndex = -1;
    this.showDropdown = true;

    setTimeout(() => this.inputRef?.nativeElement.focus(), 0);
  }

  private async fetchSuggestions(query: string) {
    if (this.cache.has(query)) {
      this.results = this.cache.get(query)!;
      this.isLoading = false;
      return;
    }

    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(query)}` +
        `&format=json&addressdetails=1&limit=7` + 
        `&countrycodes=in&accept-language=en` +
        `&viewbox=68.0,8.0,97.5,37.5` +
        `&bounded=0`;

      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      });

      const data = await res.json();
      this.cache.set(query, data);
      this.results = data;

    } catch (err) {
      console.error('Location search error:', err);
      this.results = [];

    } finally {
      this.isLoading = false;
    }
  }

  selectLocation(place: any) {
    const location: SelectedLocation = {
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      name: place.display_name,
      displayName: place.display_name,
    };

    this.query = this.getMainName(place)
    this.results = [];
    this.showDropdown = false;

    this.locationSelected.emit(location);
  }

  selectPopular(city: PopularCity) {
    this.query = city.name;
    this.results = [];
    this.showDropdown = false;

    this.locationSelected.emit({
      latitude: city.latitude,
      longitude: city.longitude,
      name: city.name,
      displayName: `${city.name}, ${city.state}, India`,
    });
  }

  getMainName(place: any): string {
    const parts = place.display_name?.split(',') || [];
    return parts.slice(0, 3).join(',').trim();
  }

  getSubName(place: any): string {
    const parts = place.display_name?.split(',') || [];
    return parts.slice(3, 6).join(',').trim();
  }

  getType(place: any): string {
    const typeMap: Record<string, string> = {
      city: 'City',
      town: 'Town',
      village: 'Village',
      suburb: 'Area',
      neighbourhood: 'Area',
      road: 'Street',
      amenity: 'Place',
      administrative: 'Region',
      state: 'State',
      postcode: 'Pincode',
      railway: 'Station',
      bus_stop: 'Bus Stop',
      hospital: 'Hospital',
      school: 'School',
      university: 'University',
      hotel: 'Hotel',
      restaurant: 'Food',
      mall: 'Mall',
    };

    const t = place.type || place.class || '';
    return typeMap[t] || 'Place';
  }

  getIcon(place: any): string {
    const t = place.type || place.class || '';

    const iconMap: Record<string, string> = {
      city: 'bi-buildings',
      town: 'bi-building',
      village: 'bi-house-door',
      suburb: 'bi-house',
      neighbourhood: 'bi-house',
      road: 'bi-sign-turn-right',
      railway: 'bi-train-front',
      bus_stop: 'bi-bus-front',
      hospital: 'bi-hospital',
      school: 'bi-mortarboard',
      university: 'bi-mortarboard-fill',
      hotel: 'bi-building-check',
      restaurant: 'bi-cup-hot',
      mall: 'bi-bag',
      park: 'bi-tree',
      airport: 'bi-airplane',
      administrative: 'bi-geo-alt',
      postcode: 'bi-mailbox',
      amenity: 'bi-geo',
    };

    return iconMap[t] || 'bi-geo-alt';
  }

  highlight(text: string, query: string): string {
    if (!query || !text) return text;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return text.replace(
      new RegExp(`(${escaped})`, 'gi'),
      '<mark>$1</mark>'
    );
  }
}