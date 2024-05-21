/* eslint-disable @typescript-eslint/dot-notation */
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Place } from 'src/app/places/place.model';

@Component({
  selector: 'app-create-booking',
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.scss'],
})
export class CreateBookingComponent implements OnInit {
  @Input() selectedPlace: Place;
  @Input() selectMode: 'select' | 'random';
  @ViewChild('f', { static: true }) form: NgForm;
  startDate: string;
  endDate: string;
  dateFrom: string;
  dateTo: string;
  constructor(private modal: ModalController) { }

  ngOnInit() {
     this.dateFrom = this.selectedPlace.availableFrom.toISOString();
     this.dateTo = this.selectedPlace.availableTo.toISOString();
    const availableFrom = new Date(this.selectedPlace.availableFrom);
    const availableTo = new Date(this.selectedPlace.availableTo);
    console.log(this.selectMode);
    if (this.selectMode === 'random') {
      this.dateFrom = new Date(
        availableFrom.getTime() + Math.random() * (availableTo.getTime() - 7*24*60*60*1000 - availableFrom.getTime())
      ).toISOString();

      this.dateTo = new Date(
        new Date(this.dateFrom).getTime() + Math.random() * (new Date(this.dateFrom).getTime() +
        6*24*60*60*1000 - new Date(this.dateFrom).getTime())
      ).toISOString();
    }
    console.log(this.dateFrom, this.dateTo);
    // console.log(this.selectedPlace);
   }

  onCancel() {
    this.modal.dismiss(null, 'cancel');
  }

  onPlaceBook() {
    if (!this.form.valid || !this.datesValid()) {
      return;
    }
    this.modal.dismiss({
      bookingData: {
        firstName: this.form.value['first-name'],
        lastName: this.form.value['last-name'],
        guestNumber: +this.form.value['guest-number'],
        startDate: new Date(this.form.value['dateFrom']),
        endDate: new Date(this.form.value['dateTo'])
    } }, 'confirm');
  }

  datesValid() {
    const startDate = new Date(this.dateFrom);
    const endDate = new Date(this.dateTo);
    return endDate > startDate;
  }

}
