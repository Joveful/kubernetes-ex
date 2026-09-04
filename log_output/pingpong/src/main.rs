use actix_web::{App, HttpResponse, HttpServer, Responder, get, web};
use sqlx::{PgPool, postgres::PgPoolOptions};

#[get("/pingpong")]
async fn pong(pool: web::Data<PgPool>) -> impl Responder {
    match sqlx::query_scalar::<_, i64>(
        "UPDATE ping_count SET count = count + 1 WHERE id = 1 RETURNING count",
    )
    .fetch_one(pool.get_ref())
    .await
    {
        Ok(count) => HttpResponse::Ok().body(format!("pong {count}")),
        Err(error) => {
            eprintln!("failed to increment ping count: {error}");
            HttpResponse::InternalServerError().body("failed to increment ping count")
        }
    }
}

#[get("/pings")]
async fn pings(pool: web::Data<PgPool>) -> impl Responder {
    match sqlx::query_scalar::<_, i64>("SELECT count FROM ping_count WHERE id = 1")
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(value) => HttpResponse::Ok()
            .content_type("text/plain; charset=utf-8")
            .body(value.to_string()),
        Err(error) => {
            eprintln!("failed to read ping count from database: {error}");
            HttpResponse::InternalServerError().body("failed to read ping count")
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("failed to connect to PostgreSQL");

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS ping_count (id INTEGER PRIMARY KEY, count BIGINT NOT NULL)",
    )
    .execute(&pool)
    .await
    .expect("failed to create ping_count table");
    sqlx::query("INSERT INTO ping_count (id, count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING")
        .execute(&pool)
        .await
        .expect("failed to initialize ping count");

    let port = std::env::var("PORT").unwrap_or_else(|_| "4000".to_string());

    println!("Listening on http://0.0.0.0:{port}");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .service(pong)
            .service(pings)
    })
    .bind(("0.0.0.0", port.parse().unwrap()))?
    .run()
    .await
}
