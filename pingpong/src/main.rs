use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

use actix_web::{App, HttpResponse, HttpServer, Responder, get, web};

#[derive(Clone)]
struct Counter {
    counter: Arc<AtomicUsize>,
}

fn build_pong_response(counter: Arc<AtomicUsize>) -> String {
    let value = counter.fetch_add(1, Ordering::SeqCst);
    return format!("pong {}", value); // rust analyzer complains if there is no return
}

#[get("/")]
async fn pong(state: web::Data<Counter>) -> impl Responder {
    let value = build_pong_response(state.counter.clone());
    HttpResponse::Ok().body(value)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let counter = Arc::new(AtomicUsize::new(0));
    let port = std::env::var("PORT").unwrap_or_else(|_| "4000".to_string());

    println!("Listening on http://0.0.0.0:{port}");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(Counter {
                counter: Arc::clone(&counter),
            }))
            .service(pong)
    })
    .bind(("0.0.0.0", port.parse().unwrap()))?
    .run()
    .await
}
