import * as _r from "@jsrs/runtime";
import { Analyzer } from "./analyzer";
import { AstKind2 } from "./ast";
import { CfScopeKind } from "./scope";
import { Transformer } from "./transformer";
import { IfStatement, Statement } from "oxc/ast/ast";
import { GetSpan } from "oxc/span";
Analyzer.prototype.exec_if_statement = function (node) {
  var _do3;
  var factory = this.factory;
  var test = this.exec_expression(node.test).get_to_boolean(this);
  {
    var _do2;
    const _t0 = test.test_truthy();
    {
      var _do;
      const _t1 = _r.matches(_t0, Some);
      _do = _t1 && _t1[1] === true;
    }
    if (_do) {
      _do2 = [true, false];
    } else if (
      do {
        const _t2 = _r.matches(_t0, Some);
        _t2 && _t2[1] === false;
      }
    ) {
      _do2 = [false, true];
    } else if ((None = _t0)) {
      var None;
      _do2 = [true, true];
    }
  }
  _do3 = _r.destruct(_do2);
  var [maybe_consequent, maybe_alternate] = _do3;
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
      const _t3 = conditional_scope.kind;
      {
        var _do5;
        const _t4 = _r.matches(_t3, CfScopeKind.ExitBlocker);
        {
          var _do4;
          const _t5 = _r.matches(_t4[1], Some);
          _do5 = _do4 = _t5 && (stopped_exit = _t5[1]);
        }
      }
      if (_do5) {
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
      const _t6 = node.alternate;
      {
        var _do6;
        const _t7 = _r.matches(_t6, Some);
        _do6 = _t7 && (alternate = _t7[1]);
      }
      if (_do6) {
        var alternate;
        {
          this.exec_statement(alternate);
          var conditional_scope = this.pop_cf_scope_and_get_mut();
          const _t8 = conditional_scope.kind;
          {
            var _do8;
            const _t9 = _r.matches(_t8, CfScopeKind.ExitBlocker);
            {
              var _do7;
              const _t10 = _r.matches(_t9[1], Some);
              _do8 = _do7 = _t10 && (stopped_exit = _t10[1]);
            }
          }
          if (_do8) {
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
    var _do0;
    if (both_exit) {
      {
        const _t11 = this.exit_to_impl(
          exit_target_inner,
          this.scope_context.cf.stack.len(),
          true,
          acc_dep,
        );
        {
          var _do9;
          const _t12 = _r.matches(_t11, Some);
          _do9 = _t12 && (acc_dep = _t12[1]);
        }
        if (_do9) {
          var acc_dep;
          {
            _do0 = this.exit_to_impl(
              exit_target_outer,
              exit_target_inner,
              false,
              acc_dep,
            );
          }
        }
      }
    } else {
      _do0 = this.exit_to_impl(
        exit_target_outer,
        this.scope_context.cf.stack.len(),
        false,
        acc_dep,
      );
    }
  }
  return _do0;
};
Transformer.prototype.transform_if_statement = function (node) {
  var { span, test, consequent, alternate } = _r.destruct(node);
  var [need_test_val, maybe_consequent, maybe_alternate] = _r.destruct(
    this.get_conditional_result(AstKind2.IfStatement(node)),
  );
  var test = this.transform_expression(test, need_test_val);
  {
    var _do1;
    if (maybe_consequent) {
      {
        _do1 = this.transform_statement(consequent);
      }
    } else {
      _do1 = None;
    }
  }
  var consequent = _do1;
  {
    var _do10;
    if (maybe_alternate) {
      {
        _do10 = alternate
          .as_ref()
          .and_then((alt) => this.transform_statement(alt));
      }
    } else {
      _do10 = None;
    }
  }
  var alternate = _do10;
  {
    var _do15;
    if (need_test_val) {
      {
        const _t13 = [consequent, alternate];
        {
          var _do11;
          const _t14 = _r.matches(_t13[0], Some);
          _do11 = _t14 && (consequent = _t14[1]);
        }
        if (_t13.length === 2 && _do11 && (alternate = _t13[1])) {
          var consequent, alternate;
          {
            _do15 = Some(
              this.ast_builder.statement_if(
                _r.deref(span),
                test.unwrap(),
                consequent,
                alternate,
              ),
            );
          }
        } else if (
          _t13.length === 2 &&
          (None = _t13[0]) &&
          do {
            const _t15 = _r.matches(_t13[1], Some);
            _t15 && (alternate = _t15[1]);
          }
        ) {
          var None, alternate;
          _do15 = Some(
            this.ast_builder.statement_if(
              _r.deref(span),
              this.build_negate_expression(test.unwrap()),
              alternate,
              None,
            ),
          );
        } else if (_t13.length === 2 && (None = _t13[0]) && (None = _t13[1])) {
          var None, None;
          _do15 = test.map((test) =>
            this.ast_builder.statement_expression(test.span(), test),
          );
        }
      }
    } else {
      var statements = this.ast_builder.vec();
      const _t16 = test;
      {
        var _do12;
        const _t17 = _r.matches(_t16, Some);
        _do12 = _t17 && (test = _t17[1]);
      }
      if (_do12) {
        var test;
        {
          statements.push(
            this.ast_builder.statement_expression(test.span(), test),
          );
        }
      }
      const _t18 = consequent;
      {
        var _do13;
        const _t19 = _r.matches(_t18, Some);
        _do13 = _t19 && (consequent = _t19[1]);
      }
      if (_do13) {
        var consequent;
        {
          statements.push(consequent);
        }
      }
      const _t20 = alternate;
      {
        var _do14;
        const _t21 = _r.matches(_t20, Some);
        _do14 = _t21 && (alternate = _t21[1]);
      }
      if (_do14) {
        var alternate;
        {
          statements.push(alternate);
        }
      }
      if (statements.is_empty()) {
        {
          _do15 = None;
        }
      } else {
        _do15 = Some(
          this.ast_builder.statement_block(_r.deref(span), statements),
        );
      }
    }
  }
  return _do15;
};
