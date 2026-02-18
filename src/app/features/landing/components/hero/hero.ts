import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  imports: [RouterLink, CommonModule],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {

}
