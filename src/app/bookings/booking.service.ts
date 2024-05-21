/* eslint-disable arrow-body-style */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable eol-last */
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { delay, map, switchMap, take, tap } from "rxjs/operators";
import { AuthService } from "../auth/auth.service";
import { Booking } from "./booking.model";

interface BookingData{
  bookedFrom: string;
  bookedTo: string;
  firstName: string;
  guestNumber: number;
  lastName: string;
  placeId: string;
  placeImage: string;
  placeTitle: string;
  userId: string;
}

@Injectable({providedIn: 'root'})
export class BookingService{
  private _bookings = new BehaviorSubject<Booking[]>([]);

  get bookings() {
    return this._bookings;
  }

  constructor(private auth: AuthService, private http: HttpClient, private authService: AuthService){}

  addBooking(placeId: string,
    placeTitle: string,
    placeImage: string,
    firstName: string,
    lastName: string,
    guestNumber: number,
    dateFrom: Date, dateTo: Date) {
    let generatedId: string;
    let newBooking: Booking;
    let fetchedUserId: string;
    return this.authService.userId.pipe(take(1), switchMap(userId => {
      if(!userId){
        throw new Error('No user id found');
      }
      fetchedUserId = userId;
      return this.authService.token;
      
    }),take(1), switchMap(token => {
      newBooking = new Booking(
        Math.random().toString(),
        placeId,
        fetchedUserId,
        placeTitle,
        placeImage,
        firstName,
        lastName,
        guestNumber,
        dateFrom,
        dateTo
      );
      return this.http.post<{ name: string }>(`https://booking-app-3cf5e-default-rtdb.firebaseio.com/booking.json?auth=${token}`, { ...newBooking, id: null })
      
    }),switchMap(res => {
        generatedId = res.name;
        return this.bookings;
      }),take(1), tap(bookings => {
        newBooking.id = generatedId;
        this._bookings.next(bookings.concat(newBooking));
      }));
  }

  cancelBooking(bookingId: string) {
    return this.authService.token.pipe(take(1), switchMap(token => {
      return this.http.delete(`https://booking-app-3cf5e-default-rtdb.firebaseio.com/booking/${bookingId}.json?auth=${token}`)

    }),switchMap(() => {
        return this.bookings;
      }),take(1), tap(bookings => {
        this._bookings.next(bookings.filter(b => b.id !== bookingId));
      }));
    // return this.bookings.pipe(take(1), delay(1000), tap(bookings => {
    //   this._bookings.next(bookings.filter(b => b.id !== bookingId));
    // }));
  }

  fetchBookings() {
    let fetchedUserId: string;
    return this.auth.userId.pipe(take(1), switchMap(userId => {
      if(!userId){
        throw new Error('No user id found!');
      }
      fetchedUserId = userId;
      return this.authService.token;
      
    }),take(1), switchMap(token => {
      return this.http.get<{ [key: string]: BookingData }>(`https://booking-app-3cf5e-default-rtdb.firebaseio.com/booking.json?auth=${token}`,
      {
        params: {
        orderBy: '"userId"',
        equalTo: `"${fetchedUserId}"`,
      },
    })
    }),map(res => {
        const bookings = [];
        for (const key in res) {
          if (res.hasOwnProperty(key)) {
            bookings.push(new Booking(key,res[key].placeId,res[key].userId,res[key].placeTitle,res[key].placeImage,res[key].firstName,res[key].lastName, res[key].guestNumber,new Date(res[key].bookedFrom),new Date(res[key].bookedTo)));
          }
        }
        return bookings;
      }), tap(bookings => {
        this._bookings.next(bookings);
      }));

  }
}
