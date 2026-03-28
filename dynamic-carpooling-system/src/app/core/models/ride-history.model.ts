export interface DriverHistoryPassengerDto {
  passengerHistoryId: string;
  driverHistoryId:    string;
  rideId:             string;
  passengerName:      string;
  pickup:             string;
  fare:               number | null;
  pickupTime:         string | null;
  ratings:            number | null;
  destination:        string;
  driverName:         string;
}
 
export interface DriverHistoryDto {
  driverHistoryId:      string;
  rideSessionId:        string;
  driverId:             string;
  driverName:           string;
  startingLocation:     string;
  destinationLocation:  string;
  dateAndTime:          string;
  dropOffTime:          string | null;
  totalFare:            number | null;
  passengers:           DriverHistoryPassengerDto[];
}
