use std::fs;

use actix_web::{App, HttpResponse, HttpServer, Responder, get};

const STATUS_FILE: &str = "/usr/src/app/files/logs.txt";

#[get("/status")]
async fn status() -> impl Responder {
    match fs::read_to_string(STATUS_FILE) {
        Ok(contents) => HttpResponse::Ok()
            .content_type("text/plain; charset=utf-8")
            .body(contents),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            HttpResponse::NotFound().body("status file is not available yet")
        }
        Err(error) => {
            eprintln!("failed to read status file: {error}");
            HttpResponse::InternalServerError().body("failed to read status file")
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());

    println!("Listening on http://0.0.0.0:{port}");

    HttpServer::new(|| App::new().service(status))
        .bind(("0.0.0.0", port.parse().unwrap()))?
        .run()
        .await
}
