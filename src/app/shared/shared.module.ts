/* eslint-disable @typescript-eslint/quotes */
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import { MapModalComponent } from "./map-modal/map-modal.component";
import { ImagePickerComponent } from "./picker/image-picker/image-picker.component";
import { LocationPickerComponent } from "./picker/location-picker/location-picker.component";


@NgModule({
  declarations: [LocationPickerComponent, MapModalComponent, ImagePickerComponent],
  imports: [CommonModule, IonicModule],
  exports: [LocationPickerComponent, MapModalComponent, ImagePickerComponent]
  //entryComponents: [MapModalComponent]
})
export class SharedModule{ }
