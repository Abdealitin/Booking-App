/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/type-annotation-spacing */
/* eslint-disable no-trailing-spaces */
import { AfterViewInit, Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
// import { rejects } from 'assert';
// import { resolve } from 'dns';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent implements OnInit, AfterViewInit {
  @ViewChild('map', { static: false }) mapElementRef: ElementRef;
  @Input() center = { lat: -34.397, lng: 150.644 };
  @Input() selectable = true;
  @Input() closeButtonText = 'Cancel';
  @Input() title = 'Pick a Location';

  constructor(private modalCtrl: ModalController, private reneder: Renderer2) { }
  ngAfterViewInit(): void {
    this.getGMaps().then(googleMaps => {
      const mapEl = this.mapElementRef.nativeElement;
      const map = new googleMaps.Map(mapEl, {
        center: this.center,
        zoom: 16
      });

      if (this.selectable) {
        map.addListener('click', event => {
        const selectedCord = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        this.modalCtrl.dismiss(selectedCord);
        });
      } else {
        const marker = new googleMaps.Marker({
          position: this.center,
          map: map,
          title: 'Picked Location'
        });
        marker.setMap(map);
      }
      // googleMaps.event.addEventListenerOnce(mapEl, 'idle', () => {
      //   this.reneder.addClass(mapEl, 'visible');
      // });
    }).catch(err => {
      console.log(err);
    });
  }

  ngOnInit() { }

  onCancel() {
    this.modalCtrl.dismiss();
  }

  private getGMaps() : Promise<any> {
    const win = window as any;
    const googleModule = win.google;
    if (googleModule && googleModule.maps) {
      return Promise.resolve(googleModule.maps);
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + environment.googleMapsAPIKey;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => {
        const loadedGModule = win.google;
        if (loadedGModule && loadedGModule.maps) {
          resolve(loadedGModule.maps);
        } else {
          reject('Google Maps SDK Not Available!');
        }
      };
    });
  }

}
