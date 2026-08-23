use std::fs;
use std::io::Write;
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

use actix_web::{App, HttpResponse, HttpServer, Responder, get, web};

const PING_COUNT_FILE: &str = "/usr/src/app/files/pingpong.txt";

#[derive(Clone)]
struct Counter {
    counter: Arc<AtomicUsize>,
}

fn write_ping_count(path: &Path, count: usize) -> std::io::Result<()> {
    let mut file = fs::File::create(path)?;
    write!(file, "{count}")?;
    file.flush()
}

fn build_pong_response(counter: Arc<AtomicUsize>) -> std::io::Result<String> {
    let value = counter.fetch_add(1, Ordering::SeqCst);
    write_ping_count(Path::new(PING_COUNT_FILE), value + 1)?;
    Ok(format!("pong {}", value))
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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    fs::create_dir_all("/usr/src/app/files")?;
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
