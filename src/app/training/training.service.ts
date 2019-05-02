import {Subject, Subscription} from 'rxjs';
import {Exercise} from './exercise.model';
import {map, take} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {UiService} from '../shared/ui.service';
import * as UI from '../shared/ui.actions';
import * as fromTraining from './training.reducer';
import * as Training from './training.actions';
import {Store} from '@ngrx/store';

@Injectable({
  providedIn: 'root'
})
export class TrainingService {

  exerciseChanged = new Subject<Exercise>();
  exercisesChanged = new Subject<Exercise[]>();
  finishedExercisesChanged = new Subject<Exercise[]>();
  private availableExercises: Exercise[] = [];
  private runningExercise: Exercise;
  private afSubscriptions: Subscription[] = [];

  constructor(private db: AngularFirestore,
              private uiService: UiService,
              private store: Store<fromTraining.State>) {}

  fetchAvailableExercises() {
    this.store.dispatch(new UI.StartLoading());
    this.afSubscriptions.push(
      this.db
      .collection('availableExercises')
      .snapshotChanges()
      .pipe(
        map(docArray => {
          return docArray.map(doc => {
            return {
              id: doc.payload.doc.id,
              // ...doc.payload.doc.data()
              // @ts-ignore
              name: doc.payload.doc.data().name,
              // @ts-ignore
              duration: doc.payload.doc.data().duration,
              // @ts-ignore
              calories: doc.payload.doc.data().calories,
            };
          });
        }))
      .subscribe((exercises: Exercise[]) => {
        this.store.dispatch(new UI.StopLoading());
        this.store.dispatch(new Training.SetAvailableTrainings(exercises));
      }, err => {
        this.store.dispatch(new UI.StopLoading());
        this.uiService.showSnackBar('Fetching Exercises failed, please try again later', null, 3000);
        this.exercisesChanged.next(null);
      })
    );
  }

  fetchCompletedOrCancelledExercises() {
    this.afSubscriptions.push(this.db
        .collection('finishedExercises')
        .valueChanges()
        .subscribe((exercises: Exercise[]) => {
          this.store.dispatch(new Training.SetFinishedTrainings(exercises));
        })
    );
  }

  cancelSubscriptions() {
    this.afSubscriptions.forEach( sub => sub.unsubscribe());
  }

  completeExercise() {
    this.store.select(fromTraining.getActiveTraining).pipe(take(1)).subscribe(ex => {
      this.addDataToDatabase({
        ...ex,
        date: new Date(),
        state: 'completed'
      });
      this.store.dispatch(new Training.StopTraining());
    });
  }

  cancelExercise(progress: number) {
    this.store.select(fromTraining.getActiveTraining).pipe(take(1)).subscribe(ex => {
      this.addDataToDatabase({
        ...ex,
        duration: ex.duration * (progress / 100),
        calories: ex.calories * (progress / 100),
        date: new Date(),
        state: 'cancelled'
      });
      this.store.dispatch(new Training.StopTraining());
    });
  }

  startExercise(selectedId: string) {
    this.store.dispatch(new Training.StartTraining(selectedId));

  }

  private addDataToDatabase(exercise: Exercise) {
    this.db.collection('finishedExercises')
      .add(exercise);
  }
}
