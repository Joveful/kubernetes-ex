# Todo app

The todo app serves a frontend in browser, which contains a random image and a basic todo application functionality. The todo backend stores and serves the todos.

## deployment

The course materials have the instructions for setting up a k3s cluster. Deploy the app to a Kubernetes cluster with
```sh
kubectl apply -f manifests/
```
Now, the app can be accessed through `localhost:8081`