// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs::File;
use std::io::Read;

static mut IMAGE_PATH: String = String::new();

#[tauri::command]
fn show_window(window: tauri::Window) {
    window.show().unwrap();
}

#[tauri::command]
fn set_image_path(path: String) {
    unsafe {
        IMAGE_PATH = path;
        //println!("{}", IMAGE_PATH);
    }
}

#[tauri::command]
fn read_image(path: String) -> Vec<u8> {
    let mut file = File::open(path).unwrap();
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).unwrap();
    buffer
}

fn main() {
    let args: Vec<String> = env::args().collect();
    dbg!(args);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![show_window, set_image_path, read_image])
        .run(tauri::generate_context!())
        .expect("failed to run img");
}
