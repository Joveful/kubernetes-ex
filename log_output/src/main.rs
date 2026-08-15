use std::sync::Arc;
use std::thread;
use std::time::Duration;

use actix_web::{App, HttpResponse, HttpServer, Responder, get, web};
use chrono::{DateTime, Local};
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize, Debug)]
struct StatusResponse {
    timestamp: String,
    uuid: String,
}

fn build_status_response(id: &Uuid, timestamp: DateTime<Local>) -> StatusResponse {
    StatusResponse {
        timestamp: timestamp.format("%Y-%m-%d %H:%M:%S%.3f").to_string(),
        uuid: id.to_string(),
    }
}

#[get("/status")]
async fn status(id: web::Data<Arc<Uuid>>) -> impl Responder {
    let timestamp = Local::now();
    let response = build_status_response(id.as_ref(), timestamp);
    HttpResponse::Ok().json(response)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let id = Arc::new(Uuid::new_v4());

    let printer_id = Arc::clone(&id);
    thread::spawn(move || {
        loop {
            let timestamp = Local::now();
            println!("{}: {}", timestamp.format("%Y-%m-%d %H:%M:%S%.3f"), printer_id);
            thread::sleep(Duration::from_secs(5));
        }
    });

    println!("Starting HTTP server on 0.0.0.0:3000");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(Arc::clone(&id)))
            .service(status)
    })
    .bind(("0.0.0.0", 3000))?
    .run()
    .await
}
