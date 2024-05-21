/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-trailing-spaces */
/* eslint-disable max-len */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController, LoadingController, ModalController, NavController } from '@ionic/angular';
import { Subscription, switchMap, take } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { BookingService } from 'src/app/bookings/booking.service';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';
import { MapModalComponent } from 'src/app/shared/map-modal/map-modal.component';
import { Place } from '../../place.model';
import { PlacesService } from '../../places.service';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {

  private placeSub: Subscription;
  isBookable = false;
  isLoading = false;
  place: Place;
  constructor(private navController: NavController, private router: Router, private alertCtrl: AlertController, private auth: AuthService, private loadingCtrl: LoadingController, private route: ActivatedRoute, private bookingService: BookingService , private placeService: PlacesService, private modal: ModalController,private actionSheetCtrl: ActionSheetController) { }
  ngOnDestroy(): void {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navController.navigateBack('/places/tabs/discover');
        return;
      }
      this.isLoading = true;
      let fetchedUserId: string;
      this.auth.userId.pipe(take(1),switchMap(userId => {
        if(!userId){
          throw new Error('No user id found!');
        }
        fetchedUserId = userId
        return this.placeService.getPlace(paramMap.get('placeId'));
      })) .subscribe(place => {
        this.place = place;
        this.isBookable = place.userId !== fetchedUserId;
        this.isLoading = false;
      }, error => {
        this.alertCtrl.create({
          header: 'An error occurred!',
          message: 'Unable to load the data',
          buttons: [{
            text: 'Okay', handler: () => {
              this.router.navigate(['/places/tabs/discover']);
          }}]
        }).then(alertEl => {
          alertEl.present();
        });
      });
    });
  }

  onBookPlace() {
    //this.router.navigateByUrl('/places/tabs/discover');
    //this.navController.navigateBack('/places/tabs/discover');
    this.actionSheetCtrl.create({
      header: 'Choose an Action',
      buttons: [
        {
          text: 'Select Date',
          handler: () => {
            this.openBookingModal('select');
          }
        },
        {
          text: 'Random Date',
          handler: () => {
            this.openBookingModal('random');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    }).then(actionSheetEl => {
      actionSheetEl.present();
    });
 }

  openBookingModal(mode: 'select' | 'random') {
    console.log(mode);
    this.modal.create({ component: CreateBookingComponent, componentProps: {selectedPlace: this.place, selectMode: mode} }).then(modalEl => {
      modalEl.present();
      return modalEl.onDidDismiss();
    })
      .then(resultData => {
        console.log(resultData);
        const data = resultData.data.bookingData;
        if (resultData.role === 'confirm') {
          this.loadingCtrl.create({ message: 'Creating Booking..' })
            .then(loadingEl => {
              loadingEl.present();
              this.bookingService.addBooking(this.place.id, this.place.title, this.place.imageUrl, data.firstName, data.lastName, data.guestNumber, data.startDate, data.endDate)
                .subscribe(() => {
                  loadingEl.dismiss();
                  this.router.navigateByUrl('/places/tabs/discover');
                });

            });
         }
      });
  }

  onShowMap() {
    this.modal.create({
      component: MapModalComponent, componentProps: {
        center: { lat: this.place.location.lat, lng: this.place.location.lng },
        selectable: false,
        closeButtonText: 'Close',
        title: this.place.location.address
    } }).then(modalEl => {
      modalEl.present();
    });
  }

}
