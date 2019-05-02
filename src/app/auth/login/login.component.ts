import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {AuthService} from '../auth.service';
import {UiService} from '../../shared/ui.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm = this.fb.group({
    email: ['', Validators.required],
    password: ['', Validators.required]
    });
  private loadingSubs: Subscription;
  isLoading = false;

  constructor(private fb: FormBuilder,
              private authService: AuthService,
              private uiService: UiService) { }

  ngOnInit() {
    this.loadingSubs = this.uiService.loadingStateChanged.subscribe(isLoading => this.isLoading = isLoading);
  }

  ngOnDestroy(): void  {
    if (this.loadingSubs) {
      this.loadingSubs.unsubscribe();
    }
  }


  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.authService.login({
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    });
  }
}
