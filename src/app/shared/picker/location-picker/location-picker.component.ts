/* eslint-disable object-shorthand */
/* eslint-disable max-len */
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Coordinates, PlaceLocation } from 'src/app/places/location.model';
import { environment } from 'src/environments/environment';
import { MapModalComponent } from '../../map-modal/map-modal.component';


@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {
  @Output() locationPick = new EventEmitter<PlaceLocation>();
  @Input() showPreview: false;
  isLoading = false;
  selectedLocationImage: string;

  constructor(private modalCtrl: ModalController, private http: HttpClient, private alertCtrl: AlertController, private actionSheetCtrl: ActionSheetController) { }

  ngOnInit() {}

  onPickLocation() {
    this.actionSheetCtrl.create({
      header: 'Please Choose',
      buttons: [
        {
          text: 'Auto-Locate', handler: () => {
            this.locateUser();
         } },
        {
          text: 'Pick on Map', handler: () => {
          this.openMap();
         } },
        { text: 'Cancel', role: 'cancel' }
      ]
    }).then(acctionEl => {
      acctionEl.present();
    });
    // this.modalCtrl.create({ component: MapModalComponent }).then(modalEl => {
    //   modalEl.onDidDismiss().then(modalData => {
    //     if (!modalData.data) {
    //       return;
    //     }
    //     this.isLoading = true;
    //     const pickedLocation: PlaceLocation = {
    //       lat: modalData.data.lat,
    //       lng: modalData.data.lng,
    //       address: null,
    //       staticMapImageUrl: null
    //     };
    //     this.getAddress(modalData.data.lat, modalData.data.lng).pipe(switchMap(address => {
    //       pickedLocation.address = address;
    //       return of(this.getMapImage(pickedLocation.lat,pickedLocation.lng, 14));
    //     })).subscribe(staticImageUrl => {
    //       pickedLocation.staticMapImageUrl = staticImageUrl;
    //       this.selectedLocationImage = staticImageUrl;
    //       this.isLoading = false;
    //       this.locationPick.emit(pickedLocation);
    //     });
    //   });
    //   modalEl.present();
    // });
  }

  private locateUser() {
    if (!Capacitor.isPluginAvailable('Geolocation')) {
      this.showErrorAlert();
      return;
    }
    this.isLoading = true;
    Geolocation.getCurrentPosition().then(geoPosition => {
      const coordinates: Coordinates = {
        lat: geoPosition.coords.latitude,
        lng: geoPosition.coords.longitude
      };
      this.createPlace(coordinates.lat, coordinates.lng);
      this.isLoading = false;
    }).catch(err => {
      this.isLoading = false;
      this.showErrorAlert();
    });
  }

  private createPlace(lat: number, lng: number) {
    this.isLoading = true;
        const pickedLocation: PlaceLocation = {
          lat: lat,
          lng: lng,
          address: null,
          staticMapImageUrl: null
        };
        this.getAddress(lat, lng).pipe(switchMap(address => {
          pickedLocation.address = address;
          return of(this.getMapImage(pickedLocation.lat,pickedLocation.lng, 14));
        })).subscribe(staticImageUrl => {
          pickedLocation.staticMapImageUrl = staticImageUrl;
          this.selectedLocationImage = staticImageUrl;
          this.isLoading = false;
          this.locationPick.emit(pickedLocation);
        });
  }

  private showErrorAlert() {
    this.alertCtrl.create({
        header: 'Unable to fetch Live Location',
      message: 'Please pich a location from map!',
        buttons: ['Okay']
      }).then(alertEl => {
        alertEl.present();
      });
  }

  private openMap() {
    this.modalCtrl.create({ component: MapModalComponent }).then(modalEl => {
      modalEl.onDidDismiss().then(modalData => {
        if (!modalData.data) {
          return;
        }
        const coordinates: Coordinates = {
          lat: modalData.data.lat,
          lng: modalData.data.lng
        };
        this.createPlace(coordinates.lat, coordinates.lng);
        // this.isLoading = true;
        // const pickedLocation: PlaceLocation = {
        //   lat: modalData.data.lat,
        //   lng: modalData.data.lng,
        //   address: null,
        //   staticMapImageUrl: null
        // };
        // this.getAddress(modalData.data.lat, modalData.data.lng).pipe(switchMap(address => {
        //   pickedLocation.address = address;
        //   return of(this.getMapImage(pickedLocation.lat,pickedLocation.lng, 14));
        // })).subscribe(staticImageUrl => {
        //   pickedLocation.staticMapImageUrl = staticImageUrl;
        //   this.selectedLocationImage = staticImageUrl;
        //   this.isLoading = false;
        //   this.locationPick.emit(pickedLocation);
        // });
      });
      modalEl.present();
    });
  }

  private getAddress(lat: number, lng: number) {
    return this.http.get<any>(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${environment.googleMapsAPIKey}`)
      .pipe(
        map(geoData => {
          if (!geoData || !geoData.results || geoData.results.length === 0) {
            return null;
          }
          return geoData.results[0].formatted_address;
        })
      );
  }

  private getMapImage(lat: number, lng: number, zoom: number) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=500x300&maptype=roadmap
&markers=color:red%7CPlace:S%7C${lat},${lng}
&key=${environment.googleMapsAPIKey}`;
  }

}
