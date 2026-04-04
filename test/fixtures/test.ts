//       use crate::{analyzer::Analyzer, ast::AstKind2, scope::CfScopeKind, transformer::Transformer};
import { Analyzer } from "./analyzer.jsrs";
import { AstKind2 } from "./ast.jsrs";
import { CfScopeKind } from "./scope.jsrs";
import { Transformer } from "./transformer.jsrs";
;
//use oxc::{
//       ast::ast::{IfStatement, Statement},
import { IfStatement, Statement } from "oxc/ast/ast";
//       span::GetSpan,
import { GetSpan } from "oxc/span";
//};
;

//impl<'a> Analyzer<'a> {
function __JSRS_impl_164<'a>() { return {
//  pub fn exec_if_statement(&mut self, node: &'a IfStatement) {
exec_if_statement(this:Analyzer<__JSRS_lifetime_a>, node: __JSRS_Ref<IfStatement>) {
//    let factory = self.factory;
    const factory = this.factory;

//    let test = self.exec_expression(&node.test).get_to_boolean(self);
    const test = this.exec_expression(__JSRS_ref(node.test)).get_to_boolean(this);

//    let (maybe_consequent, maybe_alternate) = match test.test_truthy() {
//      Some(true) => (true, false),
//      Some(false) => (false, true),
//      None => (true, true),
//    };
    const [maybe_consequent, maybe_alternate] = (() => { const __jsrs_match = test.test_truthy(); if (__JSRS_any(__jsrs_match)) return (true, false); if (__JSRS_any(__jsrs_match)) return (false, true); if (__jsrs_match === None) return (true, true); return undefined as any; })();

//    let mut both_exit = true;
    let both_exit = true;
//    let mut exit_target_inner = 0;
    let exit_target_inner = 0;
//    let mut exit_target_outer = self.scope_context.cf.stack.len();
    let exit_target_outer = this.scope_context.cf.stack.len();
//    let mut acc_dep_1 = None;
    let acc_dep_1 = None;
//    let mut acc_dep_2 = None;
    let acc_dep_2 = None;

//    if maybe_consequent {
    if (maybe_consequent){
//      self.push_if_like_branch_cf_scope(
      this.push_if_like_branch_cf_scope(
//        AstKind2::IfStatement(node),
        AstKind2.IfStatement(node),
//        CfScopeKind::ExitBlocker(None),
        CfScopeKind.ExitBlocker(None),
//        test,
        test,
//        maybe_consequent,
        maybe_consequent,
//        maybe_alternate,
        maybe_alternate,
//        true,
        true,
//        node.alternate.is_some(),
        node.alternate.is_some(),
//      );
      );
//      self.exec_statement(&node.consequent);
      this.exec_statement(__JSRS_ref(node.consequent));
//      let conditional_scope = self.pop_cf_scope_and_get_mut();
      const conditional_scope = this.pop_cf_scope_and_get_mut();
//      if let CfScopeKind::ExitBlocker(Some(stopped_exit)) = &conditional_scope.kind {
      if (__JSRS_ref(conditional_scope.kind)){ const stopped_exit = undefined as any; {
//        exit_target_inner = exit_target_inner.max(*stopped_exit);
        exit_target_inner = exit_target_inner.max(stopped_exit);
//        exit_target_outer = exit_target_outer.min(*stopped_exit);
        exit_target_outer = exit_target_outer.min(stopped_exit);
//      } else {
      } }else {
//        both_exit = false;
        both_exit = false;
//      }
      }
//      acc_dep_1 = conditional_scope.deps.try_collect(factory);
      acc_dep_1 = conditional_scope.deps.try_collect(factory);
//    }
    }
//    if maybe_alternate {
    if (maybe_alternate){
//      self.push_if_like_branch_cf_scope(
      this.push_if_like_branch_cf_scope(
//        AstKind2::IfStatement(node),
        AstKind2.IfStatement(node),
//        CfScopeKind::ExitBlocker(None),
        CfScopeKind.ExitBlocker(None),
//        test,
        test,
//        maybe_consequent,
        maybe_consequent,
//        maybe_alternate,
        maybe_alternate,
//        false,
        false,
//        true,
        true,
//      );
      );
//      if let Some(alternate) = &node.alternate {
      if (__JSRS_ref(node.alternate)){ const alternate = undefined as any; {
//        self.exec_statement(alternate);
        this.exec_statement(alternate);
//        let conditional_scope = self.pop_cf_scope_and_get_mut();
        const conditional_scope = this.pop_cf_scope_and_get_mut();
//        if let CfScopeKind::ExitBlocker(Some(stopped_exit)) = &conditional_scope.kind {
        if (__JSRS_ref(conditional_scope.kind)){ const stopped_exit = undefined as any; {
//          exit_target_inner = exit_target_inner.max(*stopped_exit);
          exit_target_inner = exit_target_inner.max(stopped_exit);
//          exit_target_outer = exit_target_outer.min(*stopped_exit);
          exit_target_outer = exit_target_outer.min(stopped_exit);
//        } else {
        } }else {
//          both_exit = false;
          both_exit = false;
//        }
        }
//        acc_dep_2 = conditional_scope.deps.try_collect(factory);
        acc_dep_2 = conditional_scope.deps.try_collect(factory);
//      } else {
      } }else {
//        self.pop_cf_scope();
        this.pop_cf_scope();
//        both_exit = false;
        both_exit = false;
//      }
      }
//    }
    }

//    let acc_dep = Some(self.consumable((acc_dep_1, acc_dep_2)));
    const acc_dep = Some(this.consumable([acc_dep_1, acc_dep_2]));
//    if both_exit {
    return (() => { if (both_exit){
//      if let Some(acc_dep) =
//        self.exit_to_impl(exit_target_inner, self.scope_context.cf.stack.len(), true, acc_dep)
//      {
      if (this.exit_to_impl(exit_target_inner, this.scope_context.cf.stack.len(), true, acc_dep)){ const acc_dep = undefined as any; {
//        self.exit_to_impl(exit_target_outer, exit_target_inner, false, acc_dep);
        this.exit_to_impl(exit_target_outer, exit_target_inner, false, acc_dep);
//      }
      } }
//    } else {
    }else {
//      self.exit_to_impl(exit_target_outer, self.scope_context.cf.stack.len(), false, acc_dep);
      this.exit_to_impl(exit_target_outer, this.scope_context.cf.stack.len(), false, acc_dep);
//    }
    } })()
//  }
  },
} }
type __JSRS_impl_164_T<'a> = ReturnType<typeof __JSRS_impl_164<'a>>;
interface Analyzer<'a> extends __JSRS_impl_164_T<'a> {}
//}


//impl<'a> Transformer<'a> {
function __JSRS_impl_2696<'a>() { return {
//  pub fn transform_if_statement(&self, node: &'a IfStatement<'a>) -> Option<Statement<'a>> {
transform_if_statement(this:Transformer<__JSRS_lifetime_a>, node: __JSRS_Ref<IfStatement<__JSRS_lifetime_a>>): Option<Statement<__JSRS_lifetime_a>> {
//    let IfStatement { span, test, consequent, alternate } = node;
    const {span, test, consequent, alternate} = node;

//    let (need_test_val, maybe_consequent, maybe_alternate) =
//      self.get_conditional_result(AstKind2::IfStatement(node));
    const [need_test_val, maybe_consequent, maybe_alternate] = this.get_conditional_result(AstKind2.IfStatement(node));

//    let test = self.transform_expression(test, need_test_val);
    const test = this.transform_expression(test, need_test_val);
//    let consequent = if maybe_consequent { self.transform_statement(consequent) } else { None };
    const consequent = (() => { if (maybe_consequent){ this.transform_statement(consequent) }else { None } })();
//    let alternate = if maybe_alternate {
    const alternate = (() => { if (maybe_alternate){
//      alternate.as_ref().and_then(|alt| self.transform_statement(alt))
      alternate.as_ref().and_then((alt) => this.transform_statement(alt))
//    } else {
    }else {
//      None
      None
//    };
    } })();

//    if need_test_val {
    return (() => { if (need_test_val){
//      match (consequent, alternate) {
//        (Some(consequent), alternate) => {
      (() => { const __jsrs_match = (consequent, alternate); if (__JSRS_any(__jsrs_match)) return (() => {
//          Some(self.ast_builder.statement_if(*span, test.unwrap(), consequent, alternate))
          Some(self.ast_builder.statement_if(*span, test.unwrap(), consequent, alternate))
//        }
//        (None, Some(alternate)) => Some(self.ast_builder.statement_if(
        })(); if (__JSRS_any(__jsrs_match)) return Some(self.ast_builder.statement_if(
//          *span,
          *span,
//          self.build_negate_expression(test.unwrap()),
          self.build_negate_expression(test.unwrap()),
//          alternate,
          alternate,
//          None,
          None,
//        )),
//        (None, None) => test.map(|test| self.ast_builder.statement_expression(test.span(), test)),
//      }
        )); if (__JSRS_any(__jsrs_match)) return test.map(|test| self.ast_builder.statement_expression(test.span(), test)); return undefined as any; })()
//    } else {
    }else {
//      let mut statements = self.ast_builder.vec();
      let statements = this.ast_builder.vec();
//      if let Some(test) = test {
      if (test){ const test = undefined as any; {
//        statements.push(self.ast_builder.statement_expression(test.span(), test));
        statements.push(this.ast_builder.statement_expression(test.span(), test));
//      }
      } }
//      if let Some(consequent) = consequent {
      if (consequent){ const consequent = undefined as any; {
//        statements.push(consequent);
        statements.push(consequent);
//      }
      } }
//      if let Some(alternate) = alternate {
      if (alternate){ const alternate = undefined as any; {
//        statements.push(alternate);
        statements.push(alternate);
//      }
      } }

//      if statements.is_empty() {
      if (statements.is_empty()){
//        None
        None
//      } else {
      }else {
//        Some(self.ast_builder.statement_block(*span, statements))
        Some(this.ast_builder.statement_block(span, statements))
//      }
      }
//    }
    } })()
//  }
  },
} }
type __JSRS_impl_2696_T<'a> = ReturnType<typeof __JSRS_impl_2696<'a>>;
interface Transformer<'a> extends __JSRS_impl_2696_T<'a> {}
//}

