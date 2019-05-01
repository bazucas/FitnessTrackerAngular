import { Component, OnInit } from '@angular/core';
import {FormBuilder, NgForm, Validators} from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  submitted = false;
  loginForm = this.fb.group({
    email: ['', Validators.required],
    password: ['', Validators.required]
    });

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    console.log(this.f);
    console.log(this.loginForm);
    console.log(this.loginForm.value);
  }
}
