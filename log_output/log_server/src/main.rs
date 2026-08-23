use std::fs;

use actix_web::{App, HttpResponse, HttpServer, Responder, get};

const STATUS_FILE: &str = "/usr/src/app/files/logs.txt";
const PING_COUNT_FILE: &str = "/usr/src/app/files/pingpong.txt";

fn latest_log_line(contents: &str) -> Option<&str> {
    contents.lines().rev().find(|line| !line.trim().is_empty())
}

#[get("/")]
async fn home() -> impl Responder {
    let status_contents = match fs::read_to_string(STATUS_FILE) {
        Ok(contents) => contents,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return HttpResponse::NotFound().body("status file is not available yet");
        }
        Err(error) => {
            eprintln!("failed to read status file: {error}");
            return HttpResponse::InternalServerError().body("failed to read status file");
        }
    };

    let latest_line = match latest_log_line(&status_contents) {
        Some(line) => line,
        None => return HttpResponse::NotFound().body("status file is empty"),
    };

    let ping_count = match fs::read_to_string(PING_COUNT_FILE) {
        Ok(count) => count.trim().to_string(),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return HttpResponse::NotFound().body("ping count is not available yet");
        }
        Err(error) => {
            eprintln!("failed to read ping count: {error}");
            return HttpResponse::InternalServerError().body("failed to read ping count");
        }
    };

    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body(format!("{latest_line}\nPing / Pongs: {ping_count}"))
}

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

    HttpServer::new(|| App::new().service(home).service(status))
        .bind(("0.0.0.0", port.parse().unwrap()))?
        .run()
        .await
}
