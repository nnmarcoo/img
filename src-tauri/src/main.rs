// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[macro_use] extern crate lazy_static;
use std::sync::Mutex;
use std::env;
use std::fs::File;
use std::io::Read;
use base64::{engine::general_purpose, Engine as _};
use std::path::{Path, PathBuf};
use std::fs;
use image::DynamicImage;
use std::thread;

lazy_static! {
    static ref IMAGE_TYPES: Vec<String> = vec![
        String::from("png"),
        String::from("jpeg"),
        String::from("jpg"),
        String::from("webp"),
        String::from("gif"),
        String::from("ico"),
        String::from("svg")
    ];
    static ref IMAGE_PATH: Mutex<String> = Mutex::new(String::new());
    static ref IMAGE_DATA: Mutex<DynamicImage> = Mutex::new(DynamicImage::new_rgba8(0, 0));
}

#[tauri::command]
fn show_window(window: tauri::Window) {
    window.show().unwrap();
}

#[tauri::command]
fn set_image_path(path: String) {
    thread::spawn(move || {
    let mut image_path = IMAGE_PATH.lock().unwrap();
    let mut image_data = IMAGE_DATA.lock().unwrap();
    *image_path = path.clone();
    *image_data = image::open(path).unwrap();
    });
}

#[tauri::command]
fn next_image() -> String {
    let (path_i, files) = images_in_current_directory();
    if path_i.unwrap() == files.len()-1 { return files[0].to_string_lossy().to_string(); }
    return files[path_i.unwrap()+1].to_string_lossy().to_string();
}

#[tauri::command]
fn prev_image() -> String{
    let (path_i, files) = images_in_current_directory();
    if path_i.unwrap() == 0 { return files[files.len()-1].to_string_lossy().to_string(); }
    return files[path_i.unwrap()-1].to_string_lossy().to_string();
}

fn images_in_current_directory() -> (Option<usize>, Vec<PathBuf>) {
    let image_path_str: &str = &*IMAGE_PATH.lock().unwrap();
    let path = Path::new(image_path_str);
    let mut files: Vec<PathBuf> = Vec::new();
    let mut path_i: Option<usize> = None;

    if let Some(parent_dir) = path.parent() {
        for file in fs::read_dir(parent_dir).unwrap() {
            let file = file.unwrap().path();
            if !file.is_file() { continue; }
            let ext = file.extension().unwrap().to_string_lossy().to_string().to_lowercase();
            if !IMAGE_TYPES.contains(&ext) { continue; }
            files.push(file.clone());
            if file == path { path_i = Some(files.len()-1); }
        }
    }
    if path_i == None {path_i = Some(0); }
    return (path_i, files);
}

#[tauri::command]
fn read_image(path: String) -> String {
    let mut file = File::open(path).unwrap();
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).unwrap();
    return general_purpose::STANDARD.encode(&buffer);
}

#[tauri::command]
fn get_image_types() -> Vec<String> {
    IMAGE_TYPES.clone()
}

#[tauri::command]
fn get_image_path() -> String {
    IMAGE_PATH.lock().unwrap().clone()
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 {
        set_image_path(args[1].to_string());
    }
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![show_window, 
                                                 set_image_path, 
                                                 get_image_types, 
                                                 get_image_path, 
                                                 read_image, 
                                                 prev_image, 
                                                 next_image])
        .run(tauri::generate_context!())
        .expect("failed to run img");
}
