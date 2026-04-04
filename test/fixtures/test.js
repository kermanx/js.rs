import * as _r from "@jsrs/runtime";
import { Analyzer } from "./analyzer";
import { AstKind2 } from "./ast";
import { CfScopeKind } from "./scope";
import { Transformer } from "./transformer";
import { IfStatement, Statement } from "oxc/ast/ast";
import { GetSpan } from "oxc/span";
Analyzer.prototype.exec_if_statement = function (node) {
  var None,
    acc_dep,
    _this = this;
  var factory = this.factory;
  var test = this.exec_expression(node.test).get_to_boolean(this);
  var [maybe_consequent, maybe_alternate] = _r.destruct(
    (function () {
      const _t0 = test.test_truthy();
      if (
        (function () {
          const _t1 = _r.matches(_t0, Some);
          return _t1 && _t1[1] === true;
        })()
      ) {
        return [true, false];
      } else if (
        (function () {
          const _t2 = _r.matches(_t0, Some);
          return _t2 && _t2[1] === false;
        })()
      ) {
        return [false, true];
      } else if ((None = _t0)) {
        return [true, true];
      }
    })(),
  );
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
      if (
        (function () {
          const _t4 = _r.matches(_t3, CfScopeKind.ExitBlocker);
          return (
            _t4 &&
            (function () {
              const _t5 = _r.matches(_t4[1], Some);
              return _t5 && (stopped_exit = _t5[1]);
            })()
          );
        })()
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
      const _t6 = node.alternate;
      if (
        (function () {
          const _t7 = _r.matches(_t6, Some);
          return _t7 && (alternate = _t7[1]);
        })()
      ) {
        var alternate;
        {
          this.exec_statement(alternate);
          var conditional_scope = this.pop_cf_scope_and_get_mut();
          const _t8 = conditional_scope.kind;
          if (
            (function () {
              const _t9 = _r.matches(_t8, CfScopeKind.ExitBlocker);
              return (
                _t9 &&
                (function () {
                  const _t10 = _r.matches(_t9[1], Some);
                  return _t10 && (stopped_exit = _t10[1]);
                })()
              );
            })()
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
  return (function () {
    if (both_exit) {
      {
        const _t11 = _this.exit_to_impl(
          exit_target_inner,
          _this.scope_context.cf.stack.len(),
          true,
          acc_dep,
        );
        if (
          (function () {
            const _t12 = _r.matches(_t11, Some);
            return _t12 && (acc_dep = _t12[1]);
          })()
        ) {
          {
            return _this.exit_to_impl(
              exit_target_outer,
              exit_target_inner,
              false,
              acc_dep,
            );
          }
        }
      }
    } else {
      return _this.exit_to_impl(
        exit_target_outer,
        _this.scope_context.cf.stack.len(),
        false,
        acc_dep,
      );
    }
  })();
};
Transformer.prototype.transform_if_statement = function (node) {
  var consequent,
    alternate,
    None,
    alternate,
    statements,
    test,
    _this2 = this;
  var { span, test, consequent, alternate } = _r.destruct(node);
  var [need_test_val, maybe_consequent, maybe_alternate] = _r.destruct(
    this.get_conditional_result(AstKind2.IfStatement(node)),
  );
  var test = this.transform_expression(test, need_test_val);
  var consequent = maybe_consequent
    ? this.transform_statement(consequent)
    : None;
  var alternate = maybe_alternate
    ? alternate.as_ref().and_then((alt) => this.transform_statement(alt))
    : None;
  return (function () {
    if (need_test_val) {
      {
        const _t13 = [consequent, alternate];
        if (
          _t13.length === 2 &&
          (function () {
            const _t14 = _r.matches(_t13[0], Some);
            return _t14 && (consequent = _t14[1]);
          })() &&
          (alternate = _t13[1])
        ) {
          {
            return Some(
              _this2.ast_builder.statement_if(
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
          (function () {
            const _t15 = _r.matches(_t13[1], Some);
            return _t15 && (alternate = _t15[1]);
          })()
        ) {
          return Some(
            _this2.ast_builder.statement_if(
              _r.deref(span),
              _this2.build_negate_expression(test.unwrap()),
              alternate,
              None,
            ),
          );
        } else if (_t13.length === 2 && (None = _t13[0]) && (None = _t13[1])) {
          var None, None;
          return test.map((test) =>
            _this2.ast_builder.statement_expression(test.span(), test),
          );
        }
      }
    } else {
      statements = _this2.ast_builder.vec();
      const _t16 = test;
      if (
        (function () {
          const _t17 = _r.matches(_t16, Some);
          return _t17 && (test = _t17[1]);
        })()
      ) {
        {
          statements.push(
            _this2.ast_builder.statement_expression(test.span(), test),
          );
        }
      }
      const _t18 = consequent;
      if (
        (function () {
          const _t19 = _r.matches(_t18, Some);
          return _t19 && (consequent = _t19[1]);
        })()
      ) {
        var consequent;
        {
          statements.push(consequent);
        }
      }
      const _t20 = alternate;
      if (
        (function () {
          const _t21 = _r.matches(_t20, Some);
          return _t21 && (alternate = _t21[1]);
        })()
      ) {
        var alternate;
        {
          statements.push(alternate);
        }
      }
      if (statements.is_empty()) {
        {
          return None;
        }
      } else {
        return Some(
          _this2.ast_builder.statement_block(_r.deref(span), statements),
        );
      }
    }
  })();
};
