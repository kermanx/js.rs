use rustc_hash::FxHashMap;
use std::fmt::Display;

#[derive(Default)]
pub struct Context {
  pub result: Vec<String>,
  pub discriminants: FxHashMap<String, usize>,
  pub matcher_quotes: usize,
  pub label_id: usize,

  pub block_post_cbs: Vec<Vec<Box<dyn FnOnce(&mut Context)>>>,
}

impl Context {
  pub fn push(&mut self, token: impl Display) {
    self.result.push(token.to_string());
  }

  pub fn get_discriminant_id(&mut self, name: &str) -> usize {
    let id = self.discriminants.len();
    *self.discriminants.entry(name.to_string()).or_insert(id)
  }

  pub fn alloc_label(&mut self) -> usize {
    self.label_id += 1;
    self.label_id
  }
  pub fn free_label(&mut self) {
    self.label_id -= 1;
  }

  pub fn block_post(&mut self, cb: impl FnOnce(&mut Context) + 'static) {
    self.block_post_cbs.last_mut().unwrap().push(Box::new(cb));
  }
}
