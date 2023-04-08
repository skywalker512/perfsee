use crate::{analyzer::Context, profile::Profile};

pub mod long_func_call;
pub mod long_lib_call;

pub trait Rule {
  fn new() -> Box<Self>
  where
    Self: Sized;
  fn analyse_profile(&self, ctx: &mut Context, profile: &Profile);
  fn code(&self) -> &'static str;
  fn desc(&self) -> &'static str {
    ""
  }
}

pub fn get_all_rules() -> Vec<Box<dyn Rule>> {
  vec![
    long_func_call::LongFuncCall::new(),
    long_lib_call::LongLibCall::new(),
  ]
}
