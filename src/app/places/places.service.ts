/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/type-annotation-spacing */
/* eslint-disable no-trailing-spaces */
/* eslint-disable arrow-body-style */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-underscore-dangle */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { delay, map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { PlaceLocation } from './location.model';
import { Place } from './place.model';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { resolve } from 'path';

interface PlaceData{
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: PlaceLocation;
}

// [
//     new Place('p1', 'The Mevar', 'Rajasthani suite in Udaipur', '../../assets/images/pexels-adriaan-greyling-764827.jpg', 2000, new Date('2019-01-01'),new Date('2019-12-31'), 'abc'),
//     new Place('p2', 'Taj Hotel', 'Most Luxurious hotel of India', '../../assets/images/pexels-amar-saleem-70441.jpg', 4000, new Date('2020-01-01'),new Date('2020-12-31'), 'abc'),
//     new Place('p3','Sayaji', 'Best Hotel to stay in Indore','../../assets/images/pexels-pixabay-258154.jpg',3000, new Date('2021-01-01'),new Date('2021-12-31'), 'abc')
//   ]

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  generatedId: string;
  location = 'uploads/';
  private _places = new BehaviorSubject<Place[]>([]);

  constructor(private authService: AuthService, private http: HttpClient,
    private angularFireStorage: AngularFireStorage) { }

  imageName() {
    const newTime = Math.floor(Date.now() / 1000);
    return Math.floor(Math.random() * 20) + newTime;
  }

  async storeImage(imageData: any) {
    try {
      const imageName = this.imageName;
      return new Promise((resolve, reject) => {
        const pictureRef = this.angularFireStorage.ref(
          this.location + Math.floor(Math.random() * 20)
        );

        pictureRef.put(imageData).then(() => {
          pictureRef.getDownloadURL().subscribe((url: any) => {
            resolve(url);
          });
        }).catch(e => {
          reject(e);
        });
      });
    } catch (error) {

    }
  }

  get places() {
    return this._places.asObservable();
  }

  fetchPlaces() {
    return this.authService.token.pipe(take(1), switchMap(token => {
      return this.http.get<{[key: string] : PlaceData}>(`https://booking-app-3cf5e-default-rtdb.firebaseio.com/offered-place.json?auth=${token}`)

    }),map(res => {
        const places = [];
        for (const key in res) {
          if (res.hasOwnProperty(key)) {
            places.push(new Place(key, res[key].title, res[key].description, res[key].imageUrl, res[key].price, new Date(res[key].availableFrom), new Date(res[key].availableTo), res[key].userId, res[key].location));
          }
        }
        return places;
        //return [];
      }),
        tap(places => {
          this._places.next(places);
      })
    );
  }

  getPlace(id: string) {
    return this.authService.token.pipe(take(1), switchMap(token => {
      return this.http.get<PlaceData>(`https://booking-app-3cf5e-default-rtdb.firebaseio.com/offered-place/${id}.json?auth=${token}`)

    }),map(res => {
        return new Place(id, res.title,res.description,res.imageUrl,res.price,new Date(res.availableFrom), new Date(res.availableTo), res.userId, res.location);
      }));
    // return this.places.pipe(take(1), map(places => {
    //   return { ...places.find(p => p.id === id) };
    // }));
  }

  uploadImage(image: File) {
    console.log(image);
    const uploadData = new FormData();
    console.log(this.storeImage(image).then(res => {
      console.log(res);
    }));
    uploadData.append('image', image);

    this.authService.token.pipe(take(1), switchMap(token => {
      return this.http.post<{imageUrl: string, imagePath: string}>(`https://us-central1-booking-app-3cf5e.cloudfunctions.net/storeImage?auth=${token}`,
      uploadData
    );
    }))

    // return this.http.post<{imageUrl: string, imagePath: string}>(`https://us-central1-booking-app-3cf5e.cloudfunctions.net/storeImage`,
    //   uploadData
    // );
  }

  addPlace(title: string, description: string, price: number, availableFrom: Date, availableTo: Date, location: PlaceLocation, imageUrl: string) {
    let newPlace: Place;
    let fetchedUserId: string;
    return this.authService.userId.pipe(take(1), switchMap(userId => {
      if(userId){
        fetchedUserId = userId;
        return this.authService.token;
      }
    }),take(1), switchMap(token => {
      if(!fetchedUserId){
        throw new Error('No user id found!');
      }
      newPlace = new Place(Math.random().toString(),title,description,imageUrl,price,availableFrom,availableTo,fetchedUserId,location);
      return this.http.post<{name: string}>(`https://booking-app-3cf5e-default-rtdb.firebaseio.com/offered-place.json?auth=${token}`, { ...newPlace, id: null })
      
    }), switchMap(resData => {
        this.generatedId = resData.name;
        return this.places;
      }),
        take(1),
        tap(places => {
          newPlace.id = this.generatedId;
          this._places.next(places.concat(newPlace));
      })
      );
    // return this.places.pipe(take(1), delay(1000), tap(places => {
    //   this._places.next(places.concat(newPlace));
    // })
    // );
    //console.log(this.places);
  }

  updatePlace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[];
    let fetchedToken: string;
    return this.authService.token.pipe(take(1), switchMap(token => {
      if(token){
        fetchedToken = token;
      }
      return this.places;
    }),take(1),
      switchMap(places => {
        if (!places || places.length <= 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      switchMap(places => {
        const updatedPlaceIndex = places.findIndex(p => p.id === placeId);
        const updatedPlaces = [...places];
        const oldPlace = updatedPlaces[updatedPlaceIndex];

        updatedPlaces[updatedPlaceIndex] = new Place(
          oldPlace.id,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId,
          oldPlace.location
        );
        return this.http.put(`https://booking-app-3cf5e-default-rtdb.firebaseio.com/offered-place/${placeId}.json?auth=${fetchedToken}`,
          { ...updatedPlaces[updatedPlaceIndex], id: null });
      }),
      tap(() => {
        this._places.next(updatedPlaces);
      })
    );

    // return this.places.pipe(take(1), delay(1000), tap(places => {
    //   const updatedPlaceIndex = places.findIndex(p => p.id === placeId);
    //   const updatedPlaces = [...places];
    //   const oldPlace = updatedPlaces[updatedPlaceIndex];

    //   updatedPlaces[updatedPlaceIndex] = new Place(
    //     oldPlace.id,
    //     title,
    //     description,
    //     oldPlace.imageUrl,
    //     oldPlace.price,
    //     oldPlace.availableFrom,
    //     oldPlace.availableTo,
    //     oldPlace.userId
    //   );
    //   this._places.next(updatedPlaces);
    // }));
  }
}
