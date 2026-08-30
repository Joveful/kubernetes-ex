use std::{eprintln, fs};
use std::io::Write;
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

use actix_web::{App, HttpResponse, HttpServer, Responder, get, web};

const PING_COUNT_FILE: &str = "/usr/src/app/files/pingpong.txt";
// const PING_COUNT_FILE: &str = "./files/pingpong.txt";

#[derive(Clone)]
struct Counter {
    counter: Arc<AtomicUsize>,
}

fn write_ping_count(path: &Path, count: usize) -> std::io::Result<()> {
    let mut file = fs::File::create(path)?;
    write!(file, "{count}")?;
    file.flush()
}

fn read_ping_count(path: &Path) -> std::io::Result<usize> {
    match fs::read_to_string(path) {
        Ok(contents) => contents.trim().parse().map_err(|error| {
            std::io::Error::new(std::io::ErrorKind::InvalidData, error)
        }),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(0),
        Err(error) => Err(error),
    }
}

fn build_pong_response(counter: Arc<AtomicUsize>) -> std::io::Result<String> {
    let value = counter.fetch_add(1, Ordering::SeqCst);
    write_ping_count(Path::new(PING_COUNT_FILE), value + 1)?;
    Ok(format!("pong {}", value + 1))
}

#[get("/pingpong")]
async fn pong(state: web::Data<Counter>) -> impl Responder {
    match build_pong_response(state.counter.clone()) {
        Ok(value) => HttpResponse::Ok().body(value),
        Err(error) => {
            eprintln!("failed to write ping count: {error}");
            HttpResponse::InternalServerError().body("failed to write ping count")
        }
    }
}

#[get("/pings")]
async fn pings() -> impl Responder {
    match read_ping_count(Path::new(PING_COUNT_FILE)) {
        Ok(value) => HttpResponse::Ok()
            .content_type("text/plain; charset=utf-8")
            .body(value.to_string()),
        Err(error) => {
            eprintln!("failed to read ping count: {error}");
            HttpResponse::InternalServerError().body("failed to read ping count")
        }
    }

}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // fs::create_dir_all("/usr/src/app/files")?;
    let count = read_ping_count(Path::new(PING_COUNT_FILE))?;
    let counter = Arc::new(AtomicUsize::new(count));
    let port = std::env::var("PORT").unwrap_or_else(|_| "4000".to_string());

    println!("Listening on http://0.0.0.0:{port}");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(Counter {
                counter: Arc::clone(&counter),
            }))
            .service(pong)
            .service(pings)
    })
    .bind(("0.0.0.0", port.parse().unwrap()))?
    .run()
    .await
}
