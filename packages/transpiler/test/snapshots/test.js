import * as _r from "@jsrs/runtime";
import { Analyzer } from "@/analyzer";
import { AstKind2 } from "@/ast";
import { CfScopeKind } from "@/scope";
import { Transformer } from "@/transformer";
import { IfStatement, Statement } from "oxc/ast/ast";
import { GetSpan } from "oxc/span";
Analyzer.prototype.exec_if_statement = function (node) {
  var _do2;
  var factory = this.factory;
  var test = this.exec_expression(node.test).get_to_boolean(this);
  {
    var _do;
    _m0 = test.test_truthy();
    if ((_m1 = _r.matches(_m0, /*Some*/ 0)) && _m1[1] === true) {
      _do = [true, false];
    } else if ((_m1 = _r.matches(_m0, /*Some*/ 1)) && _m1[1] === false) {
      _do = [false, true];
    } else if ((None = _m0)) {
      var None;
      _do = [true, true];
    }
  }
  _do2 = _r.destructure(_do);
  var [maybe_consequent, maybe_alternate] = _do2;
  var both_exit = true;
  var exit_target_inner = 0;
  var exit_target_outer = this.scope_context.cf.stack.len();
  var acc_dep_1 = None;
  var acc_dep_2 = None;
  if (maybe_consequent) {
    {
      this.push_if_like_branch_cf_scope(
        AstKind2.IfStatement(node),
        CfScopeKind.ExitBlocker(None),
        test,
        maybe_consequent,
        maybe_alternate,
        true,
        node.alternate.is_some(),
      );
      this.exec_statement(node.consequent);
      var conditional_scope = this.pop_cf_scope_and_get_mut();
      _m0 = conditional_scope.kind;
      if (
        (_m1 = _r.matches(_m0, /*CfScopeKind::ExitBlocker*/ 1)) &&
        (_m2 = _r.matches(_m1[1], /*Some*/ 1)) &&
        (stopped_exit = _m2[1])
      ) {
        var stopped_exit;
        {
          exit_target_inner = exit_target_inner.max(_r.deref(stopped_exit));
          exit_target_outer = exit_target_outer.min(_r.deref(stopped_exit));
        }
      } else {
        both_exit = false;
      }
      acc_dep_1 = conditional_scope.deps.try_collect(factory);
    }
  }
  if (maybe_alternate) {
    {
      this.push_if_like_branch_cf_scope(
        AstKind2.IfStatement(node),
        CfScopeKind.ExitBlocker(None),
        test,
        maybe_consequent,
        maybe_alternate,
        false,
        true,
      );
      _m0 = node.alternate;
      if ((_m1 = _r.matches(_m0, /*Some*/ 1)) && (alternate = _m1[1])) {
        var alternate;
        {
          this.exec_statement(alternate);
          var conditional_scope = this.pop_cf_scope_and_get_mut();
          _m0 = conditional_scope.kind;
          if (
            (_m1 = _r.matches(_m0, /*CfScopeKind::ExitBlocker*/ 1)) &&
            (_m2 = _r.matches(_m1[1], /*Some*/ 1)) &&
            (stopped_exit = _m2[1])
          ) {
            var stopped_exit;
            {
              exit_target_inner = exit_target_inner.max(_r.deref(stopped_exit));
              exit_target_outer = exit_target_outer.min(_r.deref(stopped_exit));
            }
          } else {
            both_exit = false;
          }
          acc_dep_2 = conditional_scope.deps.try_collect(factory);
        }
      } else {
        this.pop_cf_scope();
        both_exit = false;
      }
    }
  }
  var acc_dep = Some(this.consumable([acc_dep_1, acc_dep_2]));
  {
    var _do3;
    if (both_exit) {
      {
        _m0 = this.exit_to_impl(
          exit_target_inner,
          this.scope_context.cf.stack.len(),
          true,
          acc_dep,
        );
        if ((_m1 = _r.matches(_m0, /*Some*/ 1)) && (acc_dep = _m1[1])) {
          var acc_dep;
          {
            _do3 = this.exit_to_impl(
              exit_target_outer,
              exit_target_inner,
              false,
              acc_dep,
            );
          }
        }
      }
    } else {
      _do3 = this.exit_to_impl(
        exit_target_outer,
        this.scope_context.cf.stack.len(),
        false,
        acc_dep,
      );
    }
  }
  return _do3;
};
Transformer.prototype.transform_if_statement = function (node) {
  var { span, test, consequent, alternate } = _r.destructure(node);
  var [need_test_val, maybe_consequent, maybe_alternate] = _r.destructure(
    this.get_conditional_result(AstKind2.IfStatement(node)),
  );
  var test = this.transform_expression(test, need_test_val);
  {
    var _do4;
    if (maybe_consequent) {
      {
        _do4 = this.transform_statement(consequent);
      }
    } else {
      _do4 = None;
    }
  }
  var consequent = _do4;
  {
    var _do5;
    if (maybe_alternate) {
      {
        _do5 = alternate
          .as_ref()
          .and_then((alt) => this.transform_statement(alt));
      }
    } else {
      _do5 = None;
    }
  }
  var alternate = _do5;
  {
    var _do6;
    if (need_test_val) {
      {
        _m0 = [consequent, alternate];
        if (
          _m0.length === 2 &&
          (_m1 = _m0) &&
          (_m2 = _r.matches(_m1[0], /*Some*/ 1)) &&
          (consequent = _m2[1]) &&
          (alternate = _m1[1])
        ) {
          var consequent, alternate;
          {
            _do6 = Some(
              this.ast_builder.statement_if(
                _r.deref(span),
                test.unwrap(),
                consequent,
                alternate,
              ),
            );
          }
        } else if (
          _m0.length === 2 &&
          (_m1 = _m0) &&
          (None = _m1[0]) &&
          (_m2 = _r.matches(_m1[1], /*Some*/ 1)) &&
          (alternate = _m2[1])
        ) {
          var None, alternate;
          _do6 = Some(
            this.ast_builder.statement_if(
              _r.deref(span),
              this.build_negate_expression(test.unwrap()),
              alternate,
              None,
            ),
          );
        } else if (
          _m0.length === 2 &&
          (_m1 = _m0) &&
          (None = _m1[0]) &&
          (None = _m1[1])
        ) {
          var None, None;
          _do6 = test.map((test) =>
            this.ast_builder.statement_expression(test.span(), test),
          );
        }
      }
    } else {
      var statements = this.ast_builder.vec();
      _m0 = test;
      if ((_m1 = _r.matches(_m0, /*Some*/ 1)) && (test = _m1[1])) {
        var test;
        {
          statements.push(
            this.ast_builder.statement_expression(test.span(), test),
          );
        }
      }
      _m0 = consequent;
      if ((_m1 = _r.matches(_m0, /*Some*/ 1)) && (consequent = _m1[1])) {
        var consequent;
        {
          statements.push(consequent);
        }
      }
      _m0 = alternate;
      if ((_m1 = _r.matches(_m0, /*Some*/ 1)) && (alternate = _m1[1])) {
        var alternate;
        {
          statements.push(alternate);
        }
      }
      if (statements.is_empty()) {
        {
          _do6 = None;
        }
      } else {
        _do6 = Some(
          this.ast_builder.statement_block(_r.deref(span), statements),
        );
      }
    }
  }
  return _do6;
};
var _m, _m0, _m1, _m2;
