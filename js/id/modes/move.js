iD.modes.Move = function(context, entityIDs) {
    var mode = {
        id: 'move',
        button: 'browse'
    };

    var keybinding = d3.keybinding('move');

    mode.enter = function() {
        var origin,
            nudgeInterval,
            annotation = entityIDs.length === 1 ?
                t('operations.move.annotation.' + context.geometry(entityIDs[0])) :
                t('operations.move.annotation.multiple');

        context.perform(
            iD.actions.Noop(),
            annotation);

        function edge(point, size) {
            var pad = [30, 100, 30, 100];
            if (point[0] > size[0] - pad[0]) return [-10, 0];
            else if (point[0] < pad[2]) return [10, 0];
            else if (point[1] > size[1] - pad[1]) return [0, -10];
            else if (point[1] < pad[3]) return [0, 10];
            return null;
        }

        function startNudge(nudge) {
            if (nudgeInterval) window.clearInterval(nudgeInterval);
            nudgeInterval = window.setInterval(function() {
                context.pan(nudge);
            }, 50);
        }

        function stopNudge() {
            if (nudgeInterval) window.clearInterval(nudgeInterval);
            nudgeInterval = null;
        }

        function point() {
            return d3.mouse(context.map().surface.node());
        }

        function move() {
            var p = point();

            var delta = origin ?
                [p[0] - context.projection(origin)[0],
                p[1] - context.projection(origin)[1]] :
                [0, 0];

            var nudge = edge(p, context.map().size());
            if (nudge) startNudge(nudge);
            else stopNudge();

            origin = context.map().mouseCoordinates();

            context.replace(
                iD.actions.Move(entityIDs, delta, context.projection),
                annotation);
        }

        function finish() {
            d3.event.stopPropagation();
            context.enter(iD.modes.Select(context, entityIDs));
        }

        function cancel() {
            context.pop();
            context.enter(iD.modes.Select(context, entityIDs));
        }

        function undone() {
            context.enter(iD.modes.Browse(context));
        }

        context.surface()
            .on('mousemove.move', move)
            .on('click.move', finish);

        context.history()
            .on('undone.move', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3.select(document)
            .call(keybinding);
    };

    mode.exit = function() {
        context.surface()
            .on('mousemove.move', null)
            .on('click.move', null);

        context.history()
            .on('undone.move', null);

        keybinding.off();
    };

    return mode;
};
