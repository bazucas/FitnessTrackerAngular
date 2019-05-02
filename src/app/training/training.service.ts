import {Subject, Subscription} from 'rxjs';
import {Exercise} from './exercise.model';
import {map} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';

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

  constructor(private db: AngularFirestore) {}

  fetchAvailableExercises() {
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
        this.availableExercises = exercises;
        this.exercisesChanged.next([...this.availableExercises]);
      }, err => {
        console.log(err);
      })
    );
  }

  getRunningExercise() {
    return {...this.runningExercise};
  }

  fetchCompletedOrCancelledExercises() {
    this.afSubscriptions.push(this.db
        .collection('finishedExercises')
        .valueChanges()
        .subscribe((exercises: Exercise[]) => {
        this.finishedExercisesChanged.next(exercises);
      })
    );
  }

  cancelSubscriptions() {
    this.afSubscriptions.forEach( sub => sub.unsubscribe());
  }

  completeExercise() {
    this.addDataToDatabase({
      ...this.runningExercise,
      date: new Date(),
      state: 'completed'
    });
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  cancelExercise(progress: number) {
    this.addDataToDatabase({
      ...this.runningExercise,
      duration: this.runningExercise.duration * (progress / 100),
      calories: this.runningExercise.calories * (progress / 100),
      date: new Date(),
      state: 'cancelled'
    });
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  startExercise(selectedId: string) {
    // this.db.doc('availableExercises/' + selectedId).update({lastSelected: new Date()});
    this.runningExercise = this.availableExercises.find(ex => ex.id === selectedId);
    this.exerciseChanged.next({...this.runningExercise});
  }

  private addDataToDatabase(exercise: Exercise) {
    this.db.collection('finishedExercises')
      .add(exercise);
  }
}
