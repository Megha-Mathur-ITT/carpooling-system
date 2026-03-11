import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-location-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-search.html',
  styleUrls: ['./location-search.scss']
})
export class LocationSearchComponent implements OnInit {

  @Input() placeholder: string = 'Search location';
  @Output() locationSelected = new EventEmitter<any>();

  query: string = '';
  results: any[] = [];
  isLoading = false;

  private debounceTimer: any;

  private defaultLocation = {
    name: 'Jaipur, Rajasthan, India',
    latitude: 26.9124,
    longitude: 75.7873
  };

  ngOnInit() {
    this.query = this.defaultLocation.name;
    this.locationSelected.emit(this.defaultLocation);
  }

  onInput(event: Event) {
    clearTimeout(this.debounceTimer);
    const value = (event.target as HTMLInputElement).value;
    this.query = value;

    if (!value || value.length < 3) {
      this.results = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.debounceTimer = setTimeout(() => this.fetchSuggestions(value), 300);
  }

  private async fetchSuggestions(query: string) {
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=in`;
      const result = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      this.results = await result.json();
    } catch (err) {
      console.error('Location search error:', err);
      this.results = [];
    } finally {
      this.isLoading = false;
    }
  }

  selectLocation(place: any) {
    const location = {
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      name: place.display_name
    };
    this.query = place.display_name;
    this.locationSelected.emit(location);
    this.results = [];
  }

  clearResults() {
    setTimeout(() => { this.results = []; }, 200);
  }
}